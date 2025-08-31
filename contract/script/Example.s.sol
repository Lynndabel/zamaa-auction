// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../src/mocks/forge-std/Script.sol";
import "../src/AuctionFactory.sol";
import "../src/FHEAuction.sol";

/**
 * @title Example Auction Interaction Script
 * @notice Demonstrates how to create and interact with FHE auctions
 */
contract ExampleScript is Script {
    AuctionFactory public factory;
    address public factoryAddress = address(0); // Set this to deployed factory
    
    function run() external {
        uint256 userPrivateKey = vm.envUint("USER_PRIVATE_KEY");
        vm.startBroadcast(userPrivateKey);
        
        // Example 1: Create an auction
        createExampleAuction();
        
        // Example 2: Place a bid
        // placeExampleBid();
        
        // Example 3: Query auctions
        // queryAuctions();
        
        vm.stopBroadcast();
    }
    
    function createExampleAuction() public {
        factory = AuctionFactory(factoryAddress);
        
        // Auction parameters
        address nftContract = address(0x123); // Your NFT contract
        uint256 tokenId = 1;
        uint256 reservePrice = 1 ether;
        
        // Encrypt reserve price (mock for example)
        bytes memory encryptedReserve = abi.encode(reservePrice);
        
        // Create auction starting in 1 hour, 24h bidding, 24h reveal
        address auctionAddress = factory.createAuction(
            FHEAuction.AssetType.ERC721,
            nftContract,
            tokenId,
            0, // amount (not used for ERC721)
            encryptedReserve,
            block.timestamp + 1 hours,  // start time
            24 hours,                   // bidding duration
            24 hours                    // reveal duration
        );
        
        console.log("Created auction at:", auctionAddress);
        console.log("Start time:", block.timestamp + 1 hours);
        console.log("Bidding ends:", block.timestamp + 1 hours + 24 hours);
    }
    
    function placeExampleBid() public {
        address auctionAddress = address(0); // Set to auction address
        FHEAuction auction = FHEAuction(auctionAddress);
        
        // Bid amount (1.5 ETH)
        uint256 bidAmount = 1.5 ether;
        uint256 depositAmount = 2 ether; // Deposit must be >= bid
        
        // Encrypt bid (mock for example)
        bytes memory encryptedBid = abi.encode(bidAmount);
        
        // Place bid
        auction.placeBid{value: depositAmount}(encryptedBid);
        
        console.log("Placed bid on auction:", auctionAddress);
        console.log("Encrypted bid amount:", bidAmount);
        console.log("Deposit:", depositAmount);
    }
    
    function queryAuctions() public view {
        factory = AuctionFactory(factoryAddress);
        
        // Get all auctions
        address[] memory allAuctions = factory.getAllAuctions();
        console.log("Total auctions:", allAuctions.length);
        
        // Get active auctions
        address[] memory activeAuctions = factory.getActiveAuctions();
        console.log("Active auctions:", activeAuctions.length);
        
        // Get details for first auction
        if (allAuctions.length > 0) {
            (
                address seller,
                FHEAuction.AssetType assetType,
                address assetContract,
                uint256 tokenId,
                uint256 amount,
                uint256 startTime,
                uint256 biddingEndTime,
                uint256 revealEndTime,
                FHEAuction.Phase phase,
                uint256 bidderCount
            ) = factory.getAuctionDetails(allAuctions[0]);
            
            console.log("=== Auction Details ===");
            console.log("Seller:", seller);
            console.log("Asset:", assetContract);
            console.log("Token ID:", tokenId);
            console.log("Current phase:", uint(phase));
            console.log("Bidders:", bidderCount);
        }
    }
}

/**
 * @title Complete Auction Flow Example
 * @notice Shows the complete lifecycle of an auction
 */
contract CompleteFlowScript is Script {
    function run() external {
        // This example shows the complete flow
        console.log("=== FHE Auction Complete Flow ===");
        console.log("1. Seller creates auction via Factory");
        console.log("2. Seller starts bidding phase");
        console.log("3. Bidders submit encrypted bids");
        console.log("4. System transitions to reveal phase");
        console.log("5. Bidders reveal their bids");
        console.log("6. System finalizes and determines winner via FHE");
        console.log("7. Winner receives NFT, seller receives payment");
        console.log("8. Losers claim refunds");
        
        // See tests for implementation details
    }
}
