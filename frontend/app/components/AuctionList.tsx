'use client'

import { useMemo } from 'react'
import { useContractRead } from 'wagmi'
import { auctionFactoryAbi } from '../abi/auctionFactory'
import Link from 'next/link'

const FACTORY_ADDRESS = process.env.NEXT_PUBLIC_FACTORY_ADDRESS as `0x${string}` | undefined

export function AuctionList() {
  const enabled = Boolean(FACTORY_ADDRESS)

  const { data, isLoading, isError, refetch } = useContractRead({
    abi: auctionFactoryAbi,
    address: FACTORY_ADDRESS!,
    functionName: 'getActiveAuctions',
    enabled,
  })

  const auctions = useMemo(() => {
    const addrs = (data as `0x${string}`[] | undefined) || []
    return addrs.map((addr) => ({ address: addr }))
  }, [data])

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Active Auctions</h2>
        <button className="btn-secondary" onClick={() => refetch()}>Refresh</button>
      </div>

      {!FACTORY_ADDRESS && (
        <div className="text-yellow-700 bg-yellow-50 border border-yellow-200 p-3 rounded mb-6">
          Set NEXT_PUBLIC_FACTORY_ADDRESS in frontend/.env.local to view auctions.
        </div>
      )}

      {isLoading && <p className="text-gray-600">Loading auctions...</p>}
      {isError && <p className="text-red-600">Failed to load auctions.</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {auctions.map((a) => (
          <div key={a.address} className="card hover:shadow-xl transition-shadow">
            <div className="mb-4">
              <span className="text-xs uppercase text-gray-500">Auction</span>
              <p className="font-mono break-all text-gray-900">{a.address}</p>
            </div>
            <Link className="btn-primary w-full text-center inline-block" href={`/auction/${a.address}`}>
              View
            </Link>
          </div>
        ))}
      </div>

      {enabled && !isLoading && auctions.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No active auctions found.</p>
        </div>
      )}
    </div>
  )
}
