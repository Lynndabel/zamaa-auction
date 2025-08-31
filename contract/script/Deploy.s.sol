// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../src/AuctionFactory.sol";

contract DeployScript is Script {
    function run() public {
        // Get deployment private key from environment
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        // Start broadcasting transactions
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy AuctionFactory
        AuctionFactory factory = new AuctionFactory();
        
        // AuctionFactory deployed successfully
        // Platform fee: factory.platformFeePercentage() basis points
        // Fee recipient: factory.feeRecipient()
        
        vm.stopBroadcast();
    }
}

contract DeployLiskScript is Script {
    function run() public {
        // Get deployment private key
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        // Start broadcasting transactions
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy AuctionFactory
        AuctionFactory factory = new AuctionFactory();
        
        // === Deployment on Lisk Sepolia ===
        // AuctionFactory deployed at: address(factory)
        // Network: Lisk Sepolia
        
        // Optionally configure initial parameters
        // factory.setPlatformFee(300); // 3%
        
        vm.stopBroadcast();
        
        // Log deployment info
        console.log("=== Deployment on Lisk Sepolia ===");
        console.log("AuctionFactory deployed at:", address(factory));
        console.log("Network: Lisk Sepolia");
        console.log("Chain ID: 4202");
    }
}
