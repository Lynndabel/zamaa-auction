'use client'

import { useState } from 'react'

// Mock data - replace with actual contract calls
const mockAuctions = [
  {
    id: 1,
    title: 'Rare NFT #123',
    description: 'A unique digital artwork',
    currentBid: '2.5 ETH',
    endTime: '2024-01-15T18:00:00Z',
    status: 'active',
    image: 'https://via.placeholder.com/300x200'
  },
  {
    id: 2,
    title: 'CryptoPunk #456',
    description: 'One of the original CryptoPunks',
    currentBid: '15.0 ETH',
    endTime: '2024-01-20T18:00:00Z',
    status: 'active',
    image: 'https://via.placeholder.com/300x200'
  }
]

export function AuctionList() {
  const [auctions] = useState(mockAuctions)

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Active Auctions</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {auctions.map((auction) => (
          <div key={auction.id} className="card hover:shadow-xl transition-shadow">
            <img 
              src={auction.image} 
              alt={auction.title}
              className="w-full h-48 object-cover rounded-lg mb-4"
            />
            
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {auction.title}
            </h3>
            
            <p className="text-gray-600 mb-4">
              {auction.description}
            </p>
            
            <div className="space-y-2 mb-4">
              <div className="flex justify-between">
                <span className="text-gray-500">Current Bid:</span>
                <span className="font-semibold text-primary-600">{auction.currentBid}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-500">Ends:</span>
                <span className="text-sm text-gray-600">
                  {new Date(auction.endTime).toLocaleDateString()}
                </span>
              </div>
            </div>
            
            <button className="btn-primary w-full">
              Place Bid
            </button>
          </div>
        ))}
      </div>
      
      {auctions.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No active auctions found.</p>
        </div>
      )}
    </div>
  )
}
