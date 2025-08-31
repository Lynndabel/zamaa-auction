// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
import {Script} from "forge-std/Script.sol";
import {AuctionFactory} from "../src/AuctionFactory.sol";
import {FHEAuction} from "../src/FHEAuction.sol";

/**
 * @title Example Auction Interaction Script
 * @notice Demonstrates how to create and interact with FHE auctions
 */
contract ExampleScript is Script {
    AuctionFactory public factory;
    address public factoryAddress = address(0); // Set this to deployed factory
    
    function run() public {
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
        
        // Create auction starting in 1 hour, 24h bidding, 24h reveal
        address auctionAddress = factory.createAuction(
            FHEAuction.AssetType.ERC721,
            nftContract,
            tokenId,
            0, // amount (not used for ERC721)
            reservePrice,
            block.timestamp + 1 hours,  // start time
            24 hours,                   // bidding duration
            24 hours                    // reveal duration
        );
        
        // Created auction at: auctionAddress
        // Start time: block.timestamp + 1 hours
        // Bidding ends: block.timestamp + 1 hours + 24 hours
    }
    
    function placeExampleBid() public {
        address auctionAddress = address(0); // Set to auction address
        FHEAuction auction = FHEAuction(auctionAddress);
        
        // Bid amount (1.5 ETH)
        uint256 bidAmount = 1.5 ether;
        uint256 depositAmount = 2 ether; // Deposit must be >= bid
        
        // Place bid
        auction.placeBid{value: depositAmount}(bidAmount);
        
        // Placed bid on auction: auctionAddress
        // Encrypted bid amount: bidAmount
        // Deposit: depositAmount
    }
    
    function queryAuctions() public {
        AuctionFactory localFactory = AuctionFactory(factoryAddress);
        
        // Get all auctions
        address[] memory allAuctions = localFactory.getAllAuctions();
        // Total auctions: allAuctions.length
        
        // Get active auctions
        address[] memory activeAuctions = localFactory.getActiveAuctions();
        // Active auctions: activeAuctions.length
        
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
            ) = localFactory.getAuctionDetails(allAuctions[0]);
            
            // === Auction Details ===
            // Seller: seller
            // Asset: assetContract
            // Token ID: tokenId
            // Current phase: uint(phase)
            // Bidders: bidderCount
        }
    }
}

/**
 * @title Complete Auction Flow Example
 * @notice Shows the complete lifecycle of an auction
 */
contract CompleteFlowScript is Script {
    function run() public {
        // This example shows the complete flow
        // === FHE Auction Complete Flow ===
        // 1. Seller creates auction via Factory
        // 2. Seller starts bidding phase
        // 3. Bidders submit encrypted bids
        // 4. System transitions to reveal phase
        // 5. Bidders reveal their bids
        // 6. System finalizes and determines winner via FHE
        // 7. Winner receives NFT, seller receives payment
        // 8. Losers claim refunds
        
        // See tests for implementation details
    }
}
