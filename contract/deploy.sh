#!/bin/bash

echo "🚀 Deploying FHE Auction Contracts to Lisk Sepolia..."

# Check if PRIVATE_KEY is set
if [ -z "$PRIVATE_KEY" ]; then
    echo "❌ Error: PRIVATE_KEY environment variable not set"
    echo "Please set your private key: export PRIVATE_KEY=your_private_key_here"
    exit 1
fi

# Create deployments directory if it doesn't exist
mkdir -p deployments

echo "📦 Building contracts..."
forge build

if [ $? -ne 0 ]; then
    echo "❌ Build failed. Please fix compilation errors first."
    exit 1
fi

echo "✅ Build successful!"

echo "🌐 Deploying to Lisk Sepolia..."
forge script script/DeployLiskScript.s.sol:DeployLiskScript --rpc-url https://rpc.sepolia-api.lisk.com --broadcast

if [ $? -eq 0 ]; then
    echo "🎉 Deployment successful!"
            echo "📋 Check deployments/lisk-sepolia.json for contract addresses"
else
    echo "❌ Deployment failed. Check the error messages above."
    exit 1
fi
