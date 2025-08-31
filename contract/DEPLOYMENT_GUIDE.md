# 🚀 FHE Auction Deployment Guide

## Quick Deploy (< 5 minutes)

### 1. Environment Setup

```bash
# Create .env file
cat > .env << EOL
PRIVATE_KEY=your_private_key_here
RPC_URL=https://devnet.zama.ai
EOL
```

### 2. Deploy Factory Contract

```bash
# Using forge (when available)
forge script script/Deploy.s.sol:DeployZamaScript --rpc-url $RPC_URL --broadcast

# Note: If forge is not in PATH, install from: https://getfoundry.sh/
```

### 3. Verify Deployment

After deployment, you'll see:
```
=== Deployment on Zama Devnet ===
AuctionFactory deployed at: 0x...
Network: Zama Devnet
```

### 4. Create Your First Auction

Use the deployed factory address to create auctions via:
1. Direct contract interaction
2. Frontend dApp
3. Script automation

## Manual Deployment Steps

If you prefer manual deployment or forge isn't available:

### Using Remix IDE

1. **Copy Contracts**
   - Copy `FHEAuction.sol` and dependencies
   - Copy `AuctionFactory.sol`
   - Copy mock libraries from `src/mocks/`

2. **Compile**
   - Set compiler to 0.8.24
   - Enable optimization (200 runs)

3. **Deploy**
   - Deploy `AuctionFactory` first
   - Note the deployed address

### Using Hardhat

1. **Install Dependencies**
```bash
npm init -y
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
npx hardhat init
```

2. **Configure Network**
```javascript
// hardhat.config.js
module.exports = {
  networks: {
    zama: {
      url: "https://devnet.zama.ai",
      accounts: [process.env.PRIVATE_KEY]
    }
  }
};
```

3. **Deploy**
```bash
npx hardhat run scripts/deploy.js --network zama
```

## Post-Deployment

### 1. Test Auction Creation

```javascript
// Example using ethers.js
const factory = new ethers.Contract(factoryAddress, factoryABI, signer);

const tx = await factory.createAuction(
  0, // AssetType.ERC721
  nftAddress,
  tokenId,
  0,
  encryptedReservePrice,
  startTime,
  86400, // 24 hours bidding
  86400  // 24 hours reveal
);

const receipt = await tx.wait();
console.log("Auction created!");
```

### 2. Integration Checklist

- [ ] Factory deployed and verified
- [ ] Can create auctions
- [ ] Frontend connected (if applicable)
- [ ] Events being indexed
- [ ] Gas costs acceptable

### 3. Monitoring

Monitor your auctions:
```javascript
const auctions = await factory.getAllAuctions();
const activeAuctions = await factory.getActiveAuctions();
```

## Mainnet Deployment

Before mainnet:

1. **Security Audit** - Get contracts audited
2. **Gas Optimization** - Profile and optimize
3. **Upgrade Strategy** - Plan for updates
4. **Emergency Procedures** - Document pause/recovery

## Troubleshooting

### Common Issues

1. **"Forge not found"**
   - Install: `curl -L https://foundry.paradigm.xyz | bash`
   - Run: `foundryup`

2. **"Insufficient funds"**
   - Get testnet tokens from Zama faucet
   - Check your account balance

3. **"Contract size too large"**
   - Enable optimizer in config
   - Split into smaller contracts

## Support

- Discord: [Join Zama Discord](https://discord.gg/zama)
- Forum: [community.zama.ai](https://community.zama.ai)
- Docs: [docs.zama.ai](https://docs.zama.ai)

---

🎉 **Congratulations!** You've deployed an FHE-powered auction platform!
