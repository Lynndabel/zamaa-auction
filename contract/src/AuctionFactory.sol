// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./FHEAuction.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
//import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title AuctionFactory
 * @notice Factory contract for creating and managing FHE-based sealed-bid auctions
 * @dev Deploys individual auction contracts and maintains a registry
 */
contract AuctionFactory is Ownable, ReentrancyGuard {
    // Auction registry
    address[] public auctions;
    mapping(address => bool) public isValidAuction;
    mapping(address => address[]) public sellerAuctions;
    mapping(address => address[]) public assetAuctions;
    
    // Fee configuration
    uint256 public platformFeePercentage = 250; // 2.5% (basis points)
    uint256 public constant FEE_DENOMINATOR = 10000;
    address public feeRecipient;
    
    // Events
    event AuctionCreated(
        address indexed auction,
        address indexed seller,
        address indexed assetContract,
        uint256 tokenId
    );
    event PlatformFeeUpdated(uint256 newFee);
    event FeeRecipientUpdated(address newRecipient);
    
    constructor() Ownable(msg.sender) {
        feeRecipient = msg.sender;
    }
    
    /**
     * @notice Create a new FHE sealed-bid auction
     * @param _assetType Type of asset (ERC721, ERC1155, ERC20)
     * @param _assetContract Address of the asset contract
     * @param _tokenId Token ID for NFTs
     * @param _amount Amount for ERC20 or ERC1155
     * @param _reservePlain Plain reserve price (trivially encrypted on-chain for demo)
     * @param _startTime Auction start time
     * @param _biddingDuration Duration of bidding phase in seconds
     * @param _revealDuration Duration of reveal phase in seconds
     * @return auction Address of the created auction contract
     */
    function createAuction(
        FHEAuction.AssetType _assetType,
        address _assetContract,
        uint256 _tokenId,
        uint256 _amount,
        uint256 _reservePlain,
        uint256 _startTime,
        uint256 _biddingDuration,
        uint256 _revealDuration
    ) external nonReentrant returns (address auction) {
        require(_assetContract != address(0), "Invalid asset contract");
        
        // Deploy new auction contract
        FHEAuction newAuction = new FHEAuction();
        
        // Initialize the auction
        newAuction.initialize(
            msg.sender,
            _assetType,
            _assetContract,
            _tokenId,
            _amount,
            _reservePlain,
            _startTime,
            _biddingDuration,
            _revealDuration
        );
        
        auction = address(newAuction);
        
        // Update registry
        auctions.push(auction);
        isValidAuction[auction] = true;
        sellerAuctions[msg.sender].push(auction);
        assetAuctions[_assetContract].push(auction);
        
        emit AuctionCreated(auction, msg.sender, _assetContract, _tokenId);
    }
    
    /**
     * @notice Get all auctions created by the factory
     * @return Array of auction addresses
     */
    function getAllAuctions() external view returns (address[] memory) {
        return auctions;
    }
    
    /**
     * @notice Get auctions for a specific seller
     * @param _seller Address of the seller
     * @return Array of auction addresses
     */
    function getSellerAuctions(address _seller) external view returns (address[] memory) {
        return sellerAuctions[_seller];
    }
    
    /**
     * @notice Get auctions for a specific asset contract
     * @param _assetContract Address of the asset contract
     * @return Array of auction addresses
     */
    function getAssetAuctions(address _assetContract) external view returns (address[] memory) {
        return assetAuctions[_assetContract];
    }
    
    /**
     * @notice Get active auctions (in bidding or reveal phase)
     * @return activeAuctions Array of active auction addresses
     */
    function getActiveAuctions() external view returns (address[] memory activeAuctions) {
        uint256 activeCount = 0;
        
        // First pass: count active auctions
        for (uint256 i = 0; i < auctions.length; i++) {
            FHEAuction auction = FHEAuction(auctions[i]);
            (, , , , , , , , FHEAuction.Phase phase) = auction.getAuctionInfo();
            
            if (phase == FHEAuction.Phase.Bidding || phase == FHEAuction.Phase.Reveal) {
                activeCount++;
            }
        }
        
        // Second pass: populate array
        activeAuctions = new address[](activeCount);
        uint256 currentIndex = 0;
        
        for (uint256 i = 0; i < auctions.length; i++) {
            FHEAuction auction = FHEAuction(auctions[i]);
            (, , , , , , , , FHEAuction.Phase phase) = auction.getAuctionInfo();
            
            if (phase == FHEAuction.Phase.Bidding || phase == FHEAuction.Phase.Reveal) {
                activeAuctions[currentIndex] = auctions[i];
                currentIndex++;
            }
        }
    }
    
    /**
     * @notice Get auction details in a single call
     * @param _auction Address of the auction
     * @return seller Seller address
     * @return assetType Asset type
     * @return assetContract Asset contract address
     * @return tokenId Token ID
     * @return amount Amount
     * @return startTime Start time
     * @return biddingEndTime Bidding end time
     * @return revealEndTime Reveal end time
     * @return phase Current phase
     * @return bidderCount Number of bidders
     */
    function getAuctionDetails(address _auction) external view returns (
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
    ) {
        require(isValidAuction[_auction], "Invalid auction");
        
        FHEAuction auction = FHEAuction(_auction);
        
        (seller, assetType, assetContract, tokenId, amount, startTime, 
         biddingEndTime, revealEndTime, phase) = auction.getAuctionInfo();
        
        bidderCount = auction.getBidderCount();
    }
    
    /**
     * @notice Update platform fee (only owner)
     * @param _newFee New fee in basis points (100 = 1%)
     */
    function setPlatformFee(uint256 _newFee) external onlyOwner {
        require(_newFee <= 1000, "Fee too high"); // Max 10%
        platformFeePercentage = _newFee;
        emit PlatformFeeUpdated(_newFee);
    }
    
    /**
     * @notice Update fee recipient (only owner)
     * @param _newRecipient New fee recipient address
     */
    function setFeeRecipient(address _newRecipient) external onlyOwner {
        require(_newRecipient != address(0), "Invalid recipient");
        feeRecipient = _newRecipient;
        emit FeeRecipientUpdated(_newRecipient);
    }
    
    /**
     * @notice Calculate platform fee for a given amount
     * @param _amount Sale amount
     * @return fee Platform fee amount
     */
    function calculatePlatformFee(uint256 _amount) public view returns (uint256 fee) {
        fee = (_amount * platformFeePercentage) / FEE_DENOMINATOR;
    }
}
