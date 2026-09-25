// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

interface IUSDC {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
    function approve(address spender, uint256 amount) external returns (bool);
    function isBlacklisted(address account) external view returns (bool);
}

interface IVault {
    function deposit(uint256 assets, address receiver) external returns (uint256 shares);
    function redeem(uint256 shares, address receiver, address owner) external returns (uint256 assets);
    function convertToAssets(uint256 shares) external view returns (uint256);
}

/// Arc precompile: SLH-DSA-SHA2-128s verification (docs.arc.io, post-quantum security).
interface IPQ {
    function verifySlhDsaSha2128s(bytes calldata vk, bytes calldata msg_, bytes calldata sig) external view returns (bool);
}

/// @title Arc Guard
/// @notice A USDC safe deposit box. One box per wallet, two compartments: Locker (USDC sits here)
///         and Savings (USDC deposited in one ERC-4626 vault). Anything leaving the box needs two keys:
///         the owner's wallet (msg.sender) and a post-quantum SLH-DSA signature checked by Arc's
///         precompile. If the PQ key is lost, the owner can start a 7-day exit that the PQ key can cancel.
///         No admin, no pause, no upgrade path.
contract ArcGuard {
    IPQ public constant PQ = IPQ(0x1800000000000000000000000000000000000004);
    uint256 public constant EXIT_DELAY = 7 days;

    IUSDC public immutable usdc;
    IVault public immutable vault;

    struct Box {
        bytes32 pqKey; // SLH-DSA-SHA2-128s public key (32 bytes)
        uint64 nonce;
        uint64 exitReadyAt; // 0 = no exit pending
        address exitTo;
        uint256 locker; // USDC, 6 decimals
        uint256 shares; // vault shares
    }

    mapping(address => Box) public boxes;

    event Opened(address indexed owner, bytes32 pqKey);
    event Deposited(address indexed owner, uint256 amount);
    event MovedToSavings(address indexed owner, uint256 amount, uint256 shares);
    event MovedToLocker(address indexed owner, uint256 shares, uint256 amount);
    event PQVerified(address indexed owner, bytes32 digest, uint64 nonce);
    event Withdrawn(address indexed owner, address indexed to, uint256 lockerAmount, uint256 shares, uint256 savingsAmount);
    event KeyRotated(address indexed owner, bytes32 newKey);
    event ExitRequested(address indexed owner, address indexed to, uint64 readyAt);
    event ExitCancelled(address indexed owner);
    event ExitExecuted(address indexed owner, address indexed to, uint256 amount);

    error NoBox();
    error AlreadyOpen();
    error BadAmount();
    error Expired();
    error BadSignature();
    error Blocked();
    error NoExit();
    error ExitNotReady();
    error TransferFailed();

    constructor(IUSDC _usdc, IVault _vault) {
        usdc = _usdc;
        vault = _vault;
    }

    // ---------- one key (wallet) ----------

    function open(bytes32 pqKey) external {
        Box storage b = boxes[msg.sender];
        if (b.pqKey != 0) revert AlreadyOpen();
        if (pqKey == 0) revert BadAmount();
        b.pqKey = pqKey;
        emit Opened(msg.sender, pqKey);
    }

    /// Every deposit lands in the Locker. Needs a prior USDC approve.
    function deposit(uint256 amount) external {
        Box storage b = _box(msg.sender);
        if (amount == 0) revert BadAmount();
        b.locker += amount;
        if (!usdc.transferFrom(msg.sender, address(this), amount)) revert TransferFailed();
        emit Deposited(msg.sender, amount);
    }

    /// Money stays inside the box, so the wallet alone may move it.
    function moveToSavings(uint256 amount) external {
        Box storage b = _box(msg.sender);
        if (amount == 0 || amount > b.locker) revert BadAmount();
        b.locker -= amount;
        usdc.approve(address(vault), amount);
        uint256 shares = vault.deposit(amount, address(this));
        b.shares += shares;
        emit MovedToSavings(msg.sender, amount, shares);
    }

    function moveToLocker(uint256 shares) external {
        Box storage b = _box(msg.sender);
        if (shares == 0 || shares > b.shares) revert BadAmount();
        b.shares -= shares;
        uint256 amount = vault.redeem(shares, address(this), address(this));
        b.locker += amount;
        emit MovedToLocker(msg.sender, shares, amount);
    }

    /// Lost key card: start a 7-day exit. The key card can cancel it.
    function requestExit(address to) external {
        Box storage b = _box(msg.sender);
        _checkRecipient(to);
        b.exitTo = to;
        b.exitReadyAt = uint64(block.timestamp + EXIT_DELAY);
        emit ExitRequested(msg.sender, to, b.exitReadyAt);
    }

    /// After the delay, anyone may execute; funds only ever go to the address the owner chose.
    function executeExit(address owner) external {
        Box storage b = _box(owner);
        if (b.exitReadyAt == 0) revert NoExit();
        if (block.timestamp < b.exitReadyAt) revert ExitNotReady();
        address to = b.exitTo;
        (uint256 lockerAmount, uint256 shares) = (b.locker, b.shares);
        b.exitReadyAt = 0;
        b.exitTo = address(0);
        uint256 total = _payOut(b, to, lockerAmount, shares);
        emit ExitExecuted(owner, to, total);
    }

    // ---------- two keys (wallet + PQ signature) ----------

    function withdraw(address to, uint256 lockerAmount, uint256 shares, uint256 deadline, bytes calldata pqSig) external {
        Box storage b = _box(msg.sender);
        if (lockerAmount == 0 && shares == 0) revert BadAmount();
        if (lockerAmount > b.locker || shares > b.shares) revert BadAmount();
        _checkRecipient(to);
        _verify(msg.sender, b, keccak256(abi.encode("withdraw", to, lockerAmount, shares)), deadline, pqSig);
        uint256 savingsAmount = _payOut(b, to, lockerAmount, shares) - lockerAmount;
        emit Withdrawn(msg.sender, to, lockerAmount, shares, savingsAmount);
    }

    function rotateKey(bytes32 newKey, uint256 deadline, bytes calldata pqSig) external {
        Box storage b = _box(msg.sender);
        if (newKey == 0) revert BadAmount();
        _verify(msg.sender, b, keccak256(abi.encode("rotate", newKey)), deadline, pqSig);
        b.pqKey = newKey;
        emit KeyRotated(msg.sender, newKey);
    }

    /// Anyone may relay a cancel: the PQ signature is the authority.
    function cancelExit(address owner, uint256 deadline, bytes calldata pqSig) external {
        Box storage b = _box(owner);
        if (b.exitReadyAt == 0) revert NoExit();
        _verify(owner, b, keccak256(abi.encode("cancel-exit")), deadline, pqSig);
        b.exitReadyAt = 0;
        b.exitTo = address(0);
        emit ExitCancelled(owner);
    }

    // ---------- views ----------

    /// The exact 32 bytes the key card must sign for an action. Used by the web app.
    function digest(address owner, bytes32 actionHash, uint256 deadline) public view returns (bytes32) {
        return keccak256(abi.encode(block.chainid, address(this), owner, boxes[owner].nonce, actionHash, deadline));
    }

    function savingsValue(address owner) external view returns (uint256) {
        return vault.convertToAssets(boxes[owner].shares);
    }

    // ---------- internal ----------

    function _box(address owner) internal view returns (Box storage b) {
        b = boxes[owner];
        if (b.pqKey == 0) revert NoBox();
    }

    function _checkRecipient(address to) internal view {
        if (to == address(0) || usdc.isBlacklisted(to)) revert Blocked();
    }

    function _verify(address owner, Box storage b, bytes32 actionHash, uint256 deadline, bytes calldata pqSig) internal {
        if (block.timestamp > deadline) revert Expired();
        bytes32 d = digest(owner, actionHash, deadline);
        if (!PQ.verifySlhDsaSha2128s(abi.encodePacked(b.pqKey), abi.encodePacked(d), pqSig)) revert BadSignature();
        emit PQVerified(owner, d, b.nonce);
        b.nonce++;
    }

    function _payOut(Box storage b, address to, uint256 lockerAmount, uint256 shares) internal returns (uint256 total) {
        b.locker -= lockerAmount;
        b.shares -= shares;
        total = lockerAmount;
        if (shares > 0) total += vault.redeem(shares, address(this), address(this));
        if (total > 0 && !usdc.transfer(to, total)) revert TransferFailed();
    }
}
