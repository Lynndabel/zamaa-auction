'use client'

import { useMemo, useState } from 'react'
import { useAccount, useContractWrite, usePrepareContractWrite, useWaitForTransaction } from 'wagmi'
import { parseEther, parseUnits } from 'viem'
import { auctionFactoryAbi } from '../abi/auctionFactory'

const FACTORY_ADDRESS = process.env.NEXT_PUBLIC_FACTORY_ADDRESS as `0x${string}` | undefined

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

  const { isConnected } = useAccount()

  const args = useMemo(() => {
    if (!FACTORY_ADDRESS) return undefined
    try {
      // Map asset type string to enum index used in contract
      const typeMap: Record<string, number> = { ERC721: 0, ERC1155: 1, ERC20: 2 }
      const _assetType = typeMap[formData.assetType] ?? 0
      const _assetContract = formData.assetContract as `0x${string}`

      // Token ID: only meaningful for ERC721/1155
      let _tokenId = 0n
      if (formData.assetType !== 'ERC20') {
        _tokenId = formData.tokenId ? BigInt(formData.tokenId) : 0n
      }

      // Amount: ERC20 supports decimals -> parseUnits with 18 by default; ERC1155 must be integer
      let _amount = 0n
      if (formData.assetType === 'ERC20') {
        _amount = formData.amount ? parseUnits(formData.amount, 18) : 0n
      } else if (formData.assetType === 'ERC1155') {
        _amount = formData.amount ? BigInt(formData.amount) : 0n
      }

      const _reservePlain = formData.reservePrice ? parseEther(formData.reservePrice) : 0n
      // Convert datetime-local to unix seconds
      const _startTime = formData.startTime ? BigInt(Math.floor(new Date(formData.startTime).getTime() / 1000)) : 0n
      const _biddingDuration = BigInt(Number(formData.biddingDuration || '24') * 3600)
      const _revealDuration = BigInt(Number(formData.revealDuration || '24') * 3600)
      return [
        _assetType,
        _assetContract,
        _tokenId,
        _amount,
        _reservePlain,
        _startTime,
        _biddingDuration,
        _revealDuration,
      ] as const
    } catch (e) {
      // If parsing fails (e.g., decimal for BigInt), do not enable the write
      return undefined
    }
  }, [formData])

  const { config, error: prepareError } = usePrepareContractWrite({
    address: FACTORY_ADDRESS,
    abi: auctionFactoryAbi,
    functionName: 'createAuction',
    args: args as any,
    enabled: Boolean(FACTORY_ADDRESS && args && isConnected),
  })

  const { write, data: txData, isLoading: isWriting, error: writeError } = useContractWrite(config)
  const { isLoading: isPending, isSuccess } = useWaitForTransaction({ hash: txData?.hash })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (write) write()
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
      {!FACTORY_ADDRESS && (
        <div className="text-yellow-700 bg-yellow-50 border border-yellow-200 p-3 rounded mb-6">
          Set NEXT_PUBLIC_FACTORY_ADDRESS in frontend/.env.local to enable creation.
        </div>
      )}
      {!isConnected && (
        <div className="text-blue-700 bg-blue-50 border border-blue-200 p-3 rounded mb-6">
          Connect a wallet to create an auction.
        </div>
      )}
      
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

        <button
          type="submit"
          className="btn-primary w-full py-3 text-lg"
          disabled={!isConnected || !FACTORY_ADDRESS || isWriting || isPending}
        >
          {isWriting ? 'Submitting...' : isPending ? 'Waiting for confirmation...' : 'Create Auction'}
        </button>

        {(prepareError || writeError) && (
          <p className="text-red-600 text-sm">
            {(prepareError || writeError)?.message}
          </p>
        )}
        {isSuccess && (
          <p className="text-green-700 text-sm">Transaction confirmed! The auction will appear in the list shortly.</p>
        )}
      </form>
    </div>
  )
}
