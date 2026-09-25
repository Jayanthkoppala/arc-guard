// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {Script, console} from "forge-std/Script.sol";
import {ArcGuard, IUSDC, IVault} from "../src/ArcGuard.sol";

/// Arc mainnet only. USDC ERC-20 interface + Galaxy USDC (Morpho Vault V2).
contract Deploy is Script {
    function run() external {
        require(block.chainid == 5042, "not Arc mainnet");
        vm.startBroadcast(vm.envUint("PRIVATE_KEY"));
        ArcGuard g = new ArcGuard(
            IUSDC(0x3600000000000000000000000000000000000000),
            IVault(0x8E357432CC12ff425c36432F312968aEb16112AF)
        );
        vm.stopBroadcast();
        console.log("ArcGuard:", address(g));
    }
}
