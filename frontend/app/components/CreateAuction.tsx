'use client'

import { useState } from 'react'

export function CreateAuction() {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assetType: 'ERC721',
    assetContract: '',
    tokenId: '',
    amount: '',
    reservePrice: '',
    startTime: '',
    biddingDuration: '24',
    revealDuration: '24'
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Implement contract interaction
    console.log('Creating auction:', formData)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Create New Auction</h2>
      
      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Auction Details</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="input"
                placeholder="Enter auction title"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="input"
                rows={3}
                placeholder="Describe your auction item"
                required
              />
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Asset Configuration</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Asset Type
              </label>
              <select
                name="assetType"
                value={formData.assetType}
                onChange={handleChange}
                className="input"
              >
                <option value="ERC721">ERC721 (NFT)</option>
                <option value="ERC20">ERC20 (Token)</option>
                <option value="ERC1155">ERC1155 (Multi-token)</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Asset Contract Address
              </label>
              <input
                type="text"
                name="assetContract"
                value={formData.assetContract}
                onChange={handleChange}
                className="input"
                placeholder="0x..."
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Token ID
              </label>
              <input
                type="text"
                name="tokenId"
                value={formData.tokenId}
                onChange={handleChange}
                className="input"
                placeholder="Token ID"
                required
              />
            </div>
            
            {formData.assetType !== 'ERC721' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount
                </label>
                <input
                  type="text"
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  className="input"
                  placeholder="Amount to auction"
                  required
                />
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Auction Settings</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reserve Price (ETH)
              </label>
              <input
                type="number"
                name="reservePrice"
                value={formData.reservePrice}
                onChange={handleChange}
                className="input"
                placeholder="0.0"
                step="0.01"
                min="0"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Time
              </label>
              <input
                type="datetime-local"
                name="startTime"
                value={formData.startTime}
                onChange={handleChange}
                className="input"
                required
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bidding Duration (hours)
                </label>
                <input
                  type="number"
                  name="biddingDuration"
                  value={formData.biddingDuration}
                  onChange={handleChange}
                  className="input"
                  min="1"
                  max="168"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reveal Duration (hours)
                </label>
                <input
                  type="number"
                  name="revealDuration"
                  value={formData.revealDuration}
                  onChange={handleChange}
                  className="input"
                  min="1"
                  max="168"
                  required
                />
              </div>
            </div>
          </div>
        </div>

        <button type="submit" className="btn-primary w-full py-3 text-lg">
          Create Auction
        </button>
      </form>
    </div>
  )
}
