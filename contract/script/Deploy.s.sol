// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../src/mocks/forge-std/Script.sol";
import "../src/AuctionFactory.sol";

contract DeployScript is Script {
    function run() external {
        // Get deployment private key from environment
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        // Start broadcasting transactions
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy AuctionFactory
        AuctionFactory factory = new AuctionFactory();
        
        console.log("AuctionFactory deployed at:", address(factory));
        console.log("Platform fee:", factory.platformFeePercentage(), "basis points");
        console.log("Fee recipient:", factory.feeRecipient());
        
        vm.stopBroadcast();
    }
}

contract DeployZamaScript is Script {
    function run() external {
        // Configuration for Zama devnet
        string memory rpcUrl = "https://devnet.zama.ai";
        
        // Get deployment private key
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        // Set up for Zama network
        vm.createSelectFork(rpcUrl);
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy AuctionFactory
        AuctionFactory factory = new AuctionFactory();
        
        console.log("=== Deployment on Zama Devnet ===");
        console.log("AuctionFactory deployed at:", address(factory));
        console.log("Network: Zama Devnet");
        console.log("RPC URL:", rpcUrl);
        
        // Optionally configure initial parameters
        // factory.setPlatformFee(300); // 3%
        
        vm.stopBroadcast();
        
        // Save deployment info
        string memory deploymentInfo = string(
            abi.encodePacked(
                '{"factory":"',
                vm.toString(address(factory)),
                '","network":"zama-devnet","timestamp":',
                vm.toString(block.timestamp),
                '}'
            )
        );
        
        vm.writeFile("./deployments/zama-devnet.json", deploymentInfo);
        console.log("Deployment info saved to ./deployments/zama-devnet.json");
    }
}
