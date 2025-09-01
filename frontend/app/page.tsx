'use client'

import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useState } from 'react'
import { AuctionList } from './components/AuctionList'
import { CreateAuction } from './components/CreateAuction'
import { Header } from './components/Header'
import { StartBidding } from './components/StartBidding'

export default function Home() {
  const [activeTab, setActiveTab] = useState<'browse' | 'create' | 'manage'>('browse')

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <ConnectButton />
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-white rounded-lg p-1 mb-8 shadow-sm">
          <button
            onClick={() => setActiveTab('browse')}
            className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
              activeTab === 'browse'
                ? 'bg-primary-600 text-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Browse Auctions
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
              activeTab === 'create'
                ? 'bg-primary-600 text-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Create Auction
          </button>
          <button
            onClick={() => setActiveTab('manage')}
            className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
              activeTab === 'manage'
                ? 'bg-primary-600 text-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Manage
          </button>
        </div>

        {/* Content */}
        {activeTab === 'browse' && <AuctionList />}
        {activeTab === 'create' && <CreateAuction />}
        {activeTab === 'manage' && <StartBidding />}
      </main>
    </div>
  )
}
