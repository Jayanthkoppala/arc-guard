// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {Test} from "forge-std/Test.sol";
import {ArcGuard, IUSDC, IVault} from "../src/ArcGuard.sol";

/// Runs only with --fork-url https://rpc.mainnet.arc.io: real USDC, real Galaxy USDC vault, real PQ precompile.
contract ArcGuardForkTest is Test {
    IUSDC constant USDC = IUSDC(0x3600000000000000000000000000000000000000);
    IVault constant GALAXY = IVault(0x8E357432CC12ff425c36432F312968aEb16112AF);
    string constant SEED = "0x111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111";

    function test_fork_fullRoundTrip() public {
        if (block.chainid != 5042) return;
        ArcGuard g = new ArcGuard(USDC, GALAXY);
        address alice = makeAddr("alice");
        address bob = makeAddr("bob");
        vm.deal(alice, 10 ether); // native USDC, 18 decimals = 10 USDC
        string[] memory c = new string[](3);
        (c[0], c[1], c[2]) = ("bun", "scripts/pqfixture.ts", SEED);
        bytes32 key = bytes32(vm.ffi(c));

        vm.startPrank(alice);
        USDC.approve(address(g), 5e6);
        g.open(key);
        g.deposit(5e6);
        g.moveToSavings(3e6);
        vm.stopPrank();
        (,,,,, uint256 shares) = g.boxes(alice);
        assertGt(shares, 0);
        assertApproxEqAbs(g.savingsValue(alice), 3e6, 2);

        uint256 dl = block.timestamp + 1 hours;
        bytes32 d = g.digest(alice, keccak256(abi.encode("withdraw", bob, uint256(2e6), shares)), dl);
        string[] memory s = new string[](4);
        (s[0], s[1], s[2], s[3]) = ("bun", "scripts/pqfixture.ts", SEED, vm.toString(d));
        bytes memory sig = vm.ffi(s);
        vm.prank(alice);
        uint256 g0 = gasleft();
        g.withdraw(bob, 2e6, shares, dl, sig);
        emit log_named_uint("withdraw gas", g0 - gasleft());
        assertApproxEqAbs(IERC20Bal(address(USDC)).balanceOf(bob), 5e6, 2);
    }
}

interface IERC20Bal { function balanceOf(address) external view returns (uint256); }
