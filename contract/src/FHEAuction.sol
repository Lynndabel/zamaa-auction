// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "lib/fhevm/library-solidity/lib/FHE.sol";
/**
 * @title FHEAuction
 * @notice Sealed-bid auction using Fully Homomorphic Encryption (FHE)
 * @dev Uses Zama's FHE library to keep bids encrypted on-chain
 */
contract FHEAuction {
    // Asset types
    enum AssetType { ERC721, ERC1155, ERC20 }
    
    // Auction phases
    enum Phase { Created, Bidding, Reveal, Finalized, Cancelled }
    
    struct AuctionInfo {
        address seller;
        AssetType assetType;
        address assetContract;
        uint256 tokenId; // For NFTs
        uint256 amount; // For ERC20 or ERC1155
        euint32 reservePrice; // Encrypted reserve price
        uint256 startTime;
        uint256 biddingEndTime;
        uint256 revealEndTime;
        Phase phase;
    }
    
    struct Bid {
        address bidder;
        euint32 encryptedAmount; // Encrypted bid amount
        ebool isRevealed;
        uint256 depositAmount; // Plain deposit for escrow
    }
    
    // State variables
    AuctionInfo public auction;
    mapping(address => Bid) public bids;
    address[] public bidders;
    
    // Winner information (after finalization)
    address public winner;
    euint32 public winningBid;
    
    // Events
    event AuctionCreated(
        address indexed seller,
        address indexed assetContract,
        uint256 tokenId,
        uint256 startTime,
        uint256 biddingEndTime
    );
    event BidPlaced(address indexed bidder, uint256 deposit);
    event BidRevealed(address indexed bidder);
    event AuctionFinalized(address indexed winner);
    event RefundClaimed(address indexed bidder, uint256 amount);
    
    // Modifiers
    modifier onlySeller() {
        require(msg.sender == auction.seller, "Only seller");
        _;
    }
    
    modifier inPhase(Phase _phase) {
        require(auction.phase == _phase, "Wrong phase");
        _;
    }
    
    modifier afterTime(uint256 _time) {
        require(block.timestamp >= _time, "Too early");
        _;
    }
    
    modifier beforeTime(uint256 _time) {
        require(block.timestamp < _time, "Too late");
        _;
    }
    
    /**
     * @notice Initialize the auction
     * @param _seller Address of the seller
     * @param _assetType Type of asset being auctioned
     * @param _assetContract Address of the asset contract
     * @param _tokenId Token ID (for NFTs)
     * @param _amount Amount (for ERC20/ERC1155)
     * @param _encryptedReservePrice Encrypted reserve price
     * @param _startTime Auction start time
     * @param _biddingDuration Duration of bidding phase
     * @param _revealDuration Duration of reveal phase
     */
    function initialize(
        address _seller,
        AssetType _assetType,
        address _assetContract,
        uint256 _tokenId,
        uint256 _amount,
        bytes calldata _encryptedReservePrice,
        uint256 _startTime,
        uint256 _biddingDuration,
        uint256 _revealDuration
    ) external {
        require(auction.seller == address(0), "Already initialized");
        require(_seller != address(0), "Invalid seller");
        require(_assetContract != address(0), "Invalid asset");
        require(_startTime >= block.timestamp, "Invalid start time");
        require(_biddingDuration > 0, "Invalid bidding duration");
        require(_revealDuration > 0, "Invalid reveal duration");
        
        auction = AuctionInfo({
            seller: _seller,
            assetType: _assetType,
            assetContract: _assetContract,
            tokenId: _tokenId,
            amount: _amount,
            reservePrice: TFHE.asEuint32(_encryptedReservePrice),
            startTime: _startTime,
            biddingEndTime: _startTime + _biddingDuration,
            revealEndTime: _startTime + _biddingDuration + _revealDuration,
            phase: Phase.Created
        });
        
        emit AuctionCreated(_seller, _assetContract, _tokenId, _startTime, auction.biddingEndTime);
    }
    
    /**
     * @notice Start the bidding phase
     * @dev Can only be called by seller after start time
     */
    function startBidding() 
        external 
        onlySeller 
        inPhase(Phase.Created) 
        afterTime(auction.startTime) 
    {
        auction.phase = Phase.Bidding;
        
        // Transfer asset to contract
        _transferAssetIn();
    }
    
    /**
     * @notice Place an encrypted bid
     * @param _encryptedBid Encrypted bid amount
     * @dev Deposit must be sent with the transaction
     */
    function placeBid(bytes calldata _encryptedBid) 
        external 
        payable 
        inPhase(Phase.Bidding)
        beforeTime(auction.biddingEndTime)
    {
        require(msg.value > 0, "Deposit required");
        require(bids[msg.sender].bidder == address(0), "Already bid");
        
        euint32 encryptedBidAmount = TFHE.asEuint32(_encryptedBid);
        
        bids[msg.sender] = Bid({
            bidder: msg.sender,
            encryptedAmount: encryptedBidAmount,
            isRevealed: TFHE.asEbool(false),
            depositAmount: msg.value
        });
        
        bidders.push(msg.sender);
        
        emit BidPlaced(msg.sender, msg.value);
    }
    
    /**
     * @notice Transition to reveal phase
     * @dev Anyone can call this after bidding ends
     */
    function transitionToReveal() 
        external 
        inPhase(Phase.Bidding)
        afterTime(auction.biddingEndTime)
    {
        auction.phase = Phase.Reveal;
    }
    
    /**
     * @notice Reveal a bid by providing permission for decryption
     * @dev In a real implementation, this would involve threshold decryption
     */
    function revealBid() 
        external 
        inPhase(Phase.Reveal)
        beforeTime(auction.revealEndTime)
    {
        Bid storage bid = bids[msg.sender];
        require(bid.bidder == msg.sender, "No bid found");
        require(!TFHE.decrypt(bid.isRevealed), "Already revealed");
        
        bid.isRevealed = TFHE.asEbool(true);
        
        emit BidRevealed(msg.sender);
    }
    
    /**
     * @notice Finalize the auction and determine winner
     * @dev Uses FHE comparisons to find highest bid
     */
    function finalizeAuction() 
        external 
        inPhase(Phase.Reveal)
        afterTime(auction.revealEndTime)
    {
        require(bidders.length > 0, "No bids");
        
        // Initialize with first bidder
        euint32 highestBid = bids[bidders[0]].encryptedAmount;
        address currentWinner = bidders[0];
        
        // Compare all revealed bids using FHE
        for (uint256 i = 1; i < bidders.length; i++) {
            address bidder = bidders[i];
            Bid memory bid = bids[bidder];
            
            // Only consider revealed bids
            if (TFHE.decrypt(bid.isRevealed)) {
                // FHE comparison: check if this bid is higher
                ebool isHigher = TFHE.gt(bid.encryptedAmount, highestBid);
                
                // Update winner if this bid is higher
                if (TFHE.decrypt(isHigher)) {
                    highestBid = bid.encryptedAmount;
                    currentWinner = bidder;
                }
            }
        }
        
        // Check if highest bid meets reserve price
        ebool meetsReserve = TFHE.ge(highestBid, auction.reservePrice);
        
        if (TFHE.decrypt(meetsReserve)) {
            winner = currentWinner;
            winningBid = highestBid;
            auction.phase = Phase.Finalized;
            
            // Transfer asset to winner
            _transferAssetOut(winner);
            
            // Transfer payment to seller
            uint256 paymentAmount = bids[winner].depositAmount;
            payable(auction.seller).transfer(paymentAmount);
            
            emit AuctionFinalized(winner);
        } else {
            // Reserve not met, cancel auction
            auction.phase = Phase.Cancelled;
            
            // Return asset to seller
            _transferAssetOut(auction.seller);
        }
    }
    
    /**
     * @notice Claim refund for non-winning bidders
     */
    function claimRefund() external {
        require(
            auction.phase == Phase.Finalized || auction.phase == Phase.Cancelled,
            "Auction not ended"
        );
        
        Bid storage bid = bids[msg.sender];
        require(bid.depositAmount > 0, "No refund available");
        
        uint256 refundAmount = 0;
        
        if (auction.phase == Phase.Cancelled) {
            // Full refund for all bidders if cancelled
            refundAmount = bid.depositAmount;
        } else if (msg.sender != winner) {
            // Refund for non-winners
            refundAmount = bid.depositAmount;
        }
        
        if (refundAmount > 0) {
            bid.depositAmount = 0;
            payable(msg.sender).transfer(refundAmount);
            emit RefundClaimed(msg.sender, refundAmount);
        }
    }
    
    /**
     * @notice Emergency cancel by seller (only before bidding starts)
     */
    function cancelAuction() 
        external 
        onlySeller 
        inPhase(Phase.Created)
    {
        auction.phase = Phase.Cancelled;
    }
    
    // Internal functions for asset transfers
    function _transferAssetIn() private {
        if (auction.assetType == AssetType.ERC721) {
            // Simplified - would use safeTransferFrom
            (bool success, ) = auction.assetContract.call(
                abi.encodeWithSignature(
                    "transferFrom(address,address,uint256)",
                    auction.seller,
                    address(this),
                    auction.tokenId
                )
            );
            require(success, "Transfer failed");
        }
        // Add ERC20 and ERC1155 support
    }
    
    function _transferAssetOut(address _to) private {
        if (auction.assetType == AssetType.ERC721) {
            // Simplified - would use safeTransferFrom
            (bool success, ) = auction.assetContract.call(
                abi.encodeWithSignature(
                    "transferFrom(address,address,uint256)",
                    address(this),
                    _to,
                    auction.tokenId
                )
            );
            require(success, "Transfer failed");
        }
        // Add ERC20 and ERC1155 support
    }
    
    // View functions
    function getAuctionInfo() external view returns (
        address seller,
        AssetType assetType,
        address assetContract,
        uint256 tokenId,
        uint256 amount,
        uint256 startTime,
        uint256 biddingEndTime,
        uint256 revealEndTime,
        Phase phase
    ) {
        return (
            auction.seller,
            auction.assetType,
            auction.assetContract,
            auction.tokenId,
            auction.amount,
            auction.startTime,
            auction.biddingEndTime,
            auction.revealEndTime,
            auction.phase
        );
    }
    
    function getBidderCount() external view returns (uint256) {
        return bidders.length;
    }
}
