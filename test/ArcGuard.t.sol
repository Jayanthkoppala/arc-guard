// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {Test} from "forge-std/Test.sol";
import {ArcGuard, IUSDC, IVault} from "../src/ArcGuard.sol";

contract MockUSDC {
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;
    mapping(address => bool) public isBlacklisted;

    function mint(address to, uint256 a) external { balanceOf[to] += a; }
    function blacklist(address a) external { isBlacklisted[a] = true; }
    function approve(address s, uint256 a) external returns (bool) { allowance[msg.sender][s] = a; return true; }
    function transfer(address to, uint256 a) external returns (bool) { balanceOf[msg.sender] -= a; balanceOf[to] += a; return true; }
    function transferFrom(address f, address to, uint256 a) external returns (bool) {
        allowance[f][msg.sender] -= a; balanceOf[f] -= a; balanceOf[to] += a; return true;
    }
}

/// ERC-4626-shaped vault where 1 share = rate/1e6 USDC; rate grows to simulate interest.
contract MockVault {
    MockUSDC public immutable asset;
    mapping(address => uint256) public balanceOf;
    uint256 public rate = 1e6;
    constructor(MockUSDC a) { asset = a; }
    function setRate(uint256 r) external { rate = r; }
    function convertToAssets(uint256 s) public view returns (uint256) { return s * rate / 1e6; }
    function deposit(uint256 assets, address r) external returns (uint256 s) {
        asset.transferFrom(msg.sender, address(this), assets);
        s = assets * 1e6 / rate; balanceOf[r] += s;
    }
    function redeem(uint256 s, address r, address o) external returns (uint256 a) {
        balanceOf[o] -= s; a = convertToAssets(s);
        asset.mint(address(this), a); // interest source in the mock
        asset.transfer(r, a);
    }
}

contract ArcGuardTest is Test {
    MockUSDC usdc;
    MockVault vault;
    ArcGuard guard;
    address alice = address(0xA11CE);
    address bob = address(0xB0B);
    string constant SEED = "0x111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111";
    string constant SEED2 = "0x222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222";
    bytes32 key;

    function setUp() public {
        vm.chainId(5042);
        usdc = new MockUSDC();
        vault = new MockVault(usdc);
        guard = new ArcGuard(IUSDC(address(usdc)), IVault(address(vault)));
        key = _pub(SEED);
        usdc.mint(alice, 100e6);
        vm.startPrank(alice);
        usdc.approve(address(guard), type(uint256).max);
        guard.open(key);
        guard.deposit(50e6);
        vm.stopPrank();
    }

    function _pub(string memory seed) internal returns (bytes32) {
        string[] memory c = new string[](3);
        (c[0], c[1], c[2]) = ("bun", "scripts/pqfixture.ts", seed);
        return bytes32(vm.ffi(c));
    }

    function _sign(string memory seed, bytes32 msg_) internal returns (bytes memory) {
        string[] memory c = new string[](4);
        (c[0], c[1], c[2], c[3]) = ("bun", "scripts/pqfixture.ts", seed, vm.toString(msg_));
        return vm.ffi(c);
    }

    function _withdrawSig(string memory seed, address to, uint256 l, uint256 s, uint256 deadline) internal returns (bytes memory) {
        bytes32 d = guard.digest(alice, keccak256(abi.encode("withdraw", to, l, s)), deadline);
        return _sign(seed, d);
    }

    function test_twoKeyWithdraw() public {
        uint256 dl = block.timestamp + 1 hours;
        bytes memory sig = _withdrawSig(SEED, bob, 20e6, 0, dl);
        vm.prank(alice);
        guard.withdraw(bob, 20e6, 0, dl, sig);
        assertEq(usdc.balanceOf(bob), 20e6);
        (,,,, uint256 locker,) = guard.boxes(alice);
        assertEq(locker, 30e6);
    }

    function test_walletAloneCannotWithdraw_wrongKeyCard() public {
        uint256 dl = block.timestamp + 1 hours;
        bytes memory sig = _withdrawSig(SEED2, bob, 20e6, 0, dl);
        vm.prank(alice);
        vm.expectRevert(ArcGuard.BadSignature.selector);
        guard.withdraw(bob, 20e6, 0, dl, sig);
    }

    function test_keyCardAloneCannotWithdraw() public {
        uint256 dl = block.timestamp + 1 hours;
        bytes memory sig = _withdrawSig(SEED, bob, 20e6, 0, dl);
        vm.prank(bob); // not the owner: bob has no box
        vm.expectRevert(ArcGuard.NoBox.selector);
        guard.withdraw(bob, 20e6, 0, dl, sig);
    }

    function test_signatureBoundToAmountAndRecipient() public {
        uint256 dl = block.timestamp + 1 hours;
        bytes memory sig = _withdrawSig(SEED, bob, 20e6, 0, dl);
        vm.startPrank(alice);
        vm.expectRevert(ArcGuard.BadSignature.selector);
        guard.withdraw(bob, 21e6, 0, dl, sig);
        vm.expectRevert(ArcGuard.BadSignature.selector);
        guard.withdraw(address(0xE11E), 20e6, 0, dl, sig);
        vm.stopPrank();
    }

    function test_replayRejected() public {
        uint256 dl = block.timestamp + 1 hours;
        bytes memory sig = _withdrawSig(SEED, bob, 10e6, 0, dl);
        vm.startPrank(alice);
        guard.withdraw(bob, 10e6, 0, dl, sig);
        vm.expectRevert(ArcGuard.BadSignature.selector);
        guard.withdraw(bob, 10e6, 0, dl, sig);
        vm.stopPrank();
    }

    function test_expiredDeadline() public {
        uint256 dl = block.timestamp + 1 hours;
        bytes memory sig = _withdrawSig(SEED, bob, 10e6, 0, dl);
        vm.warp(dl + 1);
        vm.prank(alice);
        vm.expectRevert(ArcGuard.Expired.selector);
        guard.withdraw(bob, 10e6, 0, dl, sig);
    }

    function test_blocklistedRecipient() public {
        usdc.blacklist(bob);
        vm.prank(alice);
        vm.expectRevert(ArcGuard.Blocked.selector);
        guard.withdraw(bob, 10e6, 0, block.timestamp + 1, "");
    }

    function test_savingsRoundTripWithInterest() public {
        vm.prank(alice);
        guard.moveToSavings(40e6);
        (,,,, uint256 locker, uint256 shares) = guard.boxes(alice);
        assertEq(locker, 10e6);
        vault.setRate(1.01e6); // +1%
        assertEq(guard.savingsValue(alice), 40.4e6);
        uint256 dl = block.timestamp + 1 hours;
        bytes memory sig = _withdrawSig(SEED, bob, 10e6, shares, dl);
        vm.prank(alice);
        guard.withdraw(bob, 10e6, shares, dl, sig);
        assertEq(usdc.balanceOf(bob), 50.4e6);
    }

    function test_moveBackToLocker() public {
        vm.startPrank(alice);
        guard.moveToSavings(40e6);
        (,,,,, uint256 shares) = guard.boxes(alice);
        guard.moveToLocker(shares);
        vm.stopPrank();
        (,,,, uint256 locker, uint256 s2) = guard.boxes(alice);
        assertEq(locker, 50e6);
        assertEq(s2, 0);
    }

    function test_rotateKey() public {
        bytes32 newKey = _pub(SEED2);
        uint256 dl = block.timestamp + 1 hours;
        bytes memory sig = _sign(SEED, guard.digest(alice, keccak256(abi.encode("rotate", newKey)), dl));
        vm.prank(alice);
        guard.rotateKey(newKey, dl, sig);
        // old card no longer works, new one does
        bytes memory oldSig = _withdrawSig(SEED, bob, 5e6, 0, dl);
        vm.prank(alice);
        vm.expectRevert(ArcGuard.BadSignature.selector);
        guard.withdraw(bob, 5e6, 0, dl, oldSig);
        bytes memory newSig = _withdrawSig(SEED2, bob, 5e6, 0, dl);
        vm.prank(alice);
        guard.withdraw(bob, 5e6, 0, dl, newSig);
        assertEq(usdc.balanceOf(bob), 5e6);
    }

    function test_exitWaitsSevenDaysThenPays() public {
        vm.prank(alice);
        guard.moveToSavings(20e6);
        vm.prank(alice);
        guard.requestExit(bob);
        vm.warp(block.timestamp + 7 days - 1);
        vm.expectRevert(ArcGuard.ExitNotReady.selector);
        guard.executeExit(alice);
        vm.warp(block.timestamp + 1);
        guard.executeExit(alice);
        assertEq(usdc.balanceOf(bob), 50e6);
        vm.expectRevert(ArcGuard.NoExit.selector);
        guard.executeExit(alice);
    }

    function test_keyCardCancelsExit() public {
        vm.prank(alice);
        guard.requestExit(bob);
        uint256 dl = block.timestamp + 1 hours;
        bytes memory sig = _sign(SEED, guard.digest(alice, keccak256(abi.encode("cancel-exit")), dl));
        vm.prank(bob); // anyone can relay the cancel
        guard.cancelExit(alice, dl, sig);
        vm.warp(block.timestamp + 8 days);
        vm.expectRevert(ArcGuard.NoExit.selector);
        guard.executeExit(alice);
    }

    function test_cannotOpenTwice() public {
        vm.prank(alice);
        vm.expectRevert(ArcGuard.AlreadyOpen.selector);
        guard.open(key);
    }
}
