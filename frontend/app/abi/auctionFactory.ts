export const auctionFactoryAbi = [
  {
    type: 'function',
    name: 'getAllAuctions',
    stateMutability: 'view',
    inputs: [],
    outputs: [
      { name: '', type: 'address[]' }
    ],
  },
  {
    type: 'function',
    name: 'getActiveAuctions',
    stateMutability: 'view',
    inputs: [],
    outputs: [
      { name: 'activeAuctions', type: 'address[]' }
    ],
  },
  {
    type: 'function',
    name: 'createAuction',
    stateMutability: 'nonpayable',
    inputs: [
      { name: '_assetType', type: 'uint8' },
      { name: '_assetContract', type: 'address' },
      { name: '_tokenId', type: 'uint256' },
      { name: '_amount', type: 'uint256' },
      { name: '_reservePlain', type: 'uint256' },
      { name: '_startTime', type: 'uint256' },
      { name: '_biddingDuration', type: 'uint256' },
      { name: '_revealDuration', type: 'uint256' },
    ],
    outputs: [
      { name: 'auction', type: 'address' }
    ],
  },
] as const;
