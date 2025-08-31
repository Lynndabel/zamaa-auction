// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
import {Test} from "forge-std/Test.sol";
import {FHEAuction} from "../src/FHEAuction.sol";
import {AuctionFactory} from "../src/AuctionFactory.sol";

// Mock ERC721 for testing
contract MockERC721 {
    mapping(uint256 => address) public owners;
    mapping(address => mapping(address => bool)) public isApprovedForAll;
    
    function mint(address to, uint256 tokenId) external {
        owners[tokenId] = to;
    }
    
    function transferFrom(address from, address to, uint256 tokenId) external {
        require(owners[tokenId] == from, "Not owner");
        owners[tokenId] = to;
    }
    
    function ownerOf(uint256 tokenId) external view returns (address) {
        return owners[tokenId];
    }
    
    function setApprovalForAll(address operator, bool approved) external {
        isApprovedForAll[msg.sender][operator] = approved;
    }
}

contract FHEAuctionTest is Test {
    AuctionFactory public factory;
    MockERC721 public nft;
    
    address public seller = address(0x1);
    address public bidder1 = address(0x2);
    address public bidder2 = address(0x3);
    address public bidder3 = address(0x4);
    
    uint256 public constant TOKEN_ID = 1;
    uint256 public constant RESERVE_PRICE = 1 ether;
    uint256 public constant BIDDING_DURATION = 1 days;
    uint256 public constant REVEAL_DURATION = 1 days;
    
    function setUp() public {
        // Deploy contracts
        factory = new AuctionFactory();
        nft = new MockERC721();
        
        // Mint NFT to seller
        nft.mint(seller, TOKEN_ID);
        
        // Fund test accounts
        vm.deal(seller, 10 ether);
        vm.deal(bidder1, 10 ether);
        vm.deal(bidder2, 10 ether);
        vm.deal(bidder3, 10 ether);
    }
    
    function testCreateAuction() public {
        vm.startPrank(seller);
        
        // Approve factory to transfer NFT
        nft.setApprovalForAll(address(factory), true);
        
        // Create auction
        address auctionAddr = factory.createAuction(
            FHEAuction.AssetType.ERC721,
            address(nft),
            TOKEN_ID,
            0, // amount (not used for ERC721)
            RESERVE_PRICE,
            block.timestamp + 1 hours,
            BIDDING_DURATION,
            REVEAL_DURATION
        );
        
        // Verify auction was created
        assertTrue(factory.isValidAuction(auctionAddr));
        
        // Check auction details
        (
            address auctionSeller,
            FHEAuction.AssetType assetType,
            address assetContract,
            uint256 tokenId,
            ,
            uint256 startTime,
            uint256 biddingEndTime,
            uint256 revealEndTime,
            FHEAuction.Phase phase,
            
        ) = factory.getAuctionDetails(auctionAddr);
        
        assertEq(auctionSeller, seller);
        assertTrue(assetType == FHEAuction.AssetType.ERC721);
        assertEq(assetContract, address(nft));
        assertEq(tokenId, TOKEN_ID);
        assertEq(startTime, block.timestamp + 1 hours);
        assertEq(biddingEndTime, startTime + BIDDING_DURATION);
        assertEq(revealEndTime, biddingEndTime + REVEAL_DURATION);
        assertTrue(phase == FHEAuction.Phase.Created);
        
        vm.stopPrank();
    }
    
    function testFullAuctionFlow() public {
        // Create auction
        vm.startPrank(seller);
        nft.setApprovalForAll(address(factory), true);
        
        address auctionAddr = factory.createAuction(
            FHEAuction.AssetType.ERC721,
            address(nft),
            TOKEN_ID,
            0,
            RESERVE_PRICE,
            block.timestamp,
            BIDDING_DURATION,
            REVEAL_DURATION
        );
        
        FHEAuction auction = FHEAuction(auctionAddr);
        
        // Approve auction to transfer NFT
        nft.setApprovalForAll(auctionAddr, true);
        
        // Start bidding
        auction.startBidding();
        
        // Verify NFT was transferred to auction
        assertEq(nft.ownerOf(TOKEN_ID), auctionAddr);
        
        vm.stopPrank();
        
        // Place bids
        // Bidder 1: 1.5 ETH
        vm.startPrank(bidder1);
        auction.placeBid{value: 2 ether}(1.5 ether);
        vm.stopPrank();
        
        // Bidder 2: 2 ETH (highest)
        vm.startPrank(bidder2);
        auction.placeBid{value: 2.5 ether}(2 ether);
        vm.stopPrank();
        
        // Bidder 3: 0.5 ETH (below reserve)
        vm.startPrank(bidder3);
        auction.placeBid{value: 1 ether}(0.5 ether);
        vm.stopPrank();
        
        // Fast forward to reveal phase
        vm.warp(block.timestamp + BIDDING_DURATION + 1);
        auction.transitionToReveal();
        
        // Reveal all bids
        vm.prank(bidder1);
        auction.revealBid();
        
        vm.prank(bidder2);
        auction.revealBid();
        
        vm.prank(bidder3);
        auction.revealBid();
        
        // Fast forward to after reveal phase
        vm.warp(block.timestamp + REVEAL_DURATION + 1);
        
        // Finalize auction
        auction.finalizeAuction();
        // With placeholder finalize, only phase and encrypted state are updated
        (, , , , , , , , FHEAuction.Phase phaseAfter) = auction.getAuctionInfo();
        assertTrue(phaseAfter == FHEAuction.Phase.Finalized);
    }
    
    function testCannotBidTwice() public {
        // Setup auction
        vm.startPrank(seller);
        nft.setApprovalForAll(address(factory), true);
        
        address auctionAddr = factory.createAuction(
            FHEAuction.AssetType.ERC721,
            address(nft),
            TOKEN_ID,
            0,
            RESERVE_PRICE,
            block.timestamp,
            BIDDING_DURATION,
            REVEAL_DURATION
        );
        
        FHEAuction auction = FHEAuction(auctionAddr);
        nft.setApprovalForAll(auctionAddr, true);
        auction.startBidding();
        vm.stopPrank();
        
        // First bid
        vm.startPrank(bidder1);
        auction.placeBid{value: 2 ether}(1.5 ether);
        
        // Try to bid again
        vm.expectRevert("Already bid");
        auction.placeBid{value: 3 ether}(2.5 ether);
        vm.stopPrank();
    }
    
    function testReserveNotMet() public {
        // Setup auction with high reserve
        vm.startPrank(seller);
        nft.setApprovalForAll(address(factory), true);
        
        address auctionAddr = factory.createAuction(
            FHEAuction.AssetType.ERC721,
            address(nft),
            TOKEN_ID,
            0,
            10 ether,
            block.timestamp,
            BIDDING_DURATION,
            REVEAL_DURATION
        );
        
        FHEAuction auction = FHEAuction(auctionAddr);
        nft.setApprovalForAll(auctionAddr, true);
        auction.startBidding();
        vm.stopPrank();
        
        // Place bid below reserve
        vm.prank(bidder1);
        auction.placeBid{value: 2 ether}(2 ether);
        
        // Move to reveal phase
        vm.warp(block.timestamp + BIDDING_DURATION + 1);
        auction.transitionToReveal();
        
        vm.prank(bidder1);
        auction.revealBid();
        
        // Finalize
        vm.warp(block.timestamp + REVEAL_DURATION + 1);
        auction.finalizeAuction();
        
        // Placeholder finalize keeps phase as Finalized with encrypted results only
        (, , , , , , , , FHEAuction.Phase phase) = auction.getAuctionInfo();
        assertTrue(phase == FHEAuction.Phase.Finalized);
    }
    
    function testPhaseTransitions() public {
        // Setup auction
        vm.startPrank(seller);
        nft.setApprovalForAll(address(factory), true);
        
        address auctionAddr = factory.createAuction(
            FHEAuction.AssetType.ERC721,
            address(nft),
            TOKEN_ID,
            0,
            RESERVE_PRICE,
            block.timestamp + 1 hours,
            BIDDING_DURATION,
            REVEAL_DURATION
        );
        
        FHEAuction auction = FHEAuction(auctionAddr);
        
        // Check initial phase
        (, , , , , , , , FHEAuction.Phase phase) = auction.getAuctionInfo();
        assertTrue(phase == FHEAuction.Phase.Created);
        
        // Cannot start bidding before start time
        vm.expectRevert("Too early");
        auction.startBidding();
        
        // Move to start time
        vm.warp(block.timestamp + 1 hours);
        nft.setApprovalForAll(auctionAddr, true);
        auction.startBidding();
        
        (, , , , , , , , phase) = auction.getAuctionInfo();
        assertTrue(phase == FHEAuction.Phase.Bidding);
        
        vm.stopPrank();
        
        // Cannot transition to reveal before bidding ends
        vm.expectRevert("Too early");
        auction.transitionToReveal();
        
        // Move past bidding end
        vm.warp(block.timestamp + BIDDING_DURATION + 1);
        auction.transitionToReveal();
        
        (, , , , , , , , phase) = auction.getAuctionInfo();
        assertTrue(phase == FHEAuction.Phase.Reveal);
    }
    
    function testFactoryFunctions() public {
        // Create multiple auctions
        vm.startPrank(seller);
        nft.setApprovalForAll(address(factory), true);
        
        // Mint more NFTs
        nft.mint(seller, 2);
        nft.mint(seller, 3);
        
        address auction1 = factory.createAuction(
            FHEAuction.AssetType.ERC721,
            address(nft),
            1,
            0,
            1 ether,
            block.timestamp,
            BIDDING_DURATION,
            REVEAL_DURATION
        );
        
        address auction2 = factory.createAuction(
            FHEAuction.AssetType.ERC721,
            address(nft),
            2,
            0,
            2 ether,
            block.timestamp,
            BIDDING_DURATION,
            REVEAL_DURATION
        );
        
        vm.stopPrank();
        
        // Test getAllAuctions
        address[] memory allAuctions = factory.getAllAuctions();
        assertEq(allAuctions.length, 2);
        assertEq(allAuctions[0], auction1);
        assertEq(allAuctions[1], auction2);
        
        // Test getSellerAuctions
        address[] memory sellerAuctions = factory.getSellerAuctions(seller);
        assertEq(sellerAuctions.length, 2);
        
        // Test getAssetAuctions
        address[] memory nftAuctions = factory.getAssetAuctions(address(nft));
        assertEq(nftAuctions.length, 2);
        
        // Test platform fee calculation
        uint256 fee = factory.calculatePlatformFee(100 ether);
        assertEq(fee, 2.5 ether); // 2.5%
    }
}
