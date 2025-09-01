'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { useAccount, useContractRead, usePrepareContractWrite, useContractWrite, useWaitForTransaction } from 'wagmi'
import { fheAuctionAbi } from '../../abi/fheAuction'
import { parseUnits, formatEther } from 'viem'

function formatCountdown(totalSec: number): string {
  if (totalSec < 0) totalSec = 0
  const d = Math.floor(totalSec / 86400)
  const h = Math.floor((totalSec % 86400) / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = Math.floor(totalSec % 60)
  if (d > 0) return `${d}d ${h}h ${m}m`
  if (h > 0) return `${h}h ${m}m ${s}s`
  return `${m}m ${s}s`
}

function formatEth(wei: bigint): string {
  try {
    const eth = formatEther(wei)
    // trim to 6 decimals max
    const [i, f = ''] = eth.split('.')
    return f ? `${i}.${f.slice(0, 6)}` : i
  } catch {
    return '0'
  }
}

export default function AuctionDetailPage() {
  const params = useParams<{ address: `0x${string}` }>()
  const router = useRouter()
  const address = params?.address as `0x${string}` | undefined
  const { address: account } = useAccount()

  useEffect(() => {
    if (!address) {
      router.replace('/')
    }
  }, [address, router])

  const { data, isLoading, isError, refetch } = useContractRead({
    address,
    abi: fheAuctionAbi,
    functionName: 'getAuctionInfo',
    enabled: Boolean(address),
  })

  // Read bidder count
  const { data: bidderCountData } = useContractRead({
    address,
    abi: fheAuctionAbi,
    functionName: 'getBidderCount',
    enabled: Boolean(address),
    watch: true,
  })

  // Read current user's bid status
  const { data: myBidData } = useContractRead({
    address,
    abi: fheAuctionAbi,
    functionName: 'bids',
    args: account ? [account] : undefined,
    enabled: Boolean(address && account),
    watch: true,
  })

  const info = useMemo(() => {
    if (!data) return null
    const [seller, assetType, assetContract, tokenId, amount, startTime, biddingEnd, revealEnd, phase] = data as [
      `0x${string}`, number, `0x${string}`, bigint, bigint, bigint, bigint, bigint, number
    ]
    return {
      seller,
      assetType,
      assetContract,
      tokenId: tokenId.toString(),
      amount: amount.toString(),
      startTime: Number(startTime),
      biddingEnd: Number(biddingEnd),
      revealEnd: Number(revealEnd),
      phase,
    }
  }, [data])

  const bidderCount = (bidderCountData as bigint | undefined) ? Number(bidderCountData as bigint) : 0
  const myBid = useMemo(() => {
    if (!myBidData) return null
    const [bidder, _enc, isRevealed, depositAmount] = myBidData as [
      `0x${string}`, string, boolean, bigint
    ]
    return { bidder, isRevealed, depositAmount }
  }, [myBidData])
  const hasMyBid = useMemo(() => {
    try {
      return myBid ? myBid.depositAmount > 0n : false
    } catch { return false }
  }, [myBid])

  // -------- Bid form state --------
  const [bidPlain, setBidPlain] = useState('')
  const [depositEth, setDepositEth] = useState('')
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000))

  // live clock for countdowns
  useEffect(() => {
    const t = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000)
    return () => clearInterval(t)
  }, [])

  // Prepare placeBid with value
  const bidArgs = useMemo(() => {
    try {
      if (!address || !bidPlain) return undefined
      // integer-only check
      if (!/^\d+$/.test(bidPlain)) return undefined
      const bidNum = BigInt(bidPlain)
      return [bidNum] as const
    } catch {
      return undefined
    }
  }, [address, bidPlain])

  const depositValue = useMemo(() => {
    try {
      if (!depositEth) return undefined
      // positive decimal
      if (!/^(?:\d+)(?:\.\d+)?$/.test(depositEth)) return undefined
      // deposit in ETH; use 18 decimals
      return parseUnits(depositEth, 18)
    } catch {
      return undefined
    }
  }, [depositEth])

  const biddingOpen = info && info.phase === 1 && now < info.biddingEnd

  const { config: placeBidConfig, error: placeBidPrepareError } = usePrepareContractWrite({
    address,
    abi: fheAuctionAbi,
    functionName: 'placeBid',
    args: bidArgs,
    value: depositValue,
    enabled: Boolean(address && bidArgs && depositValue && biddingOpen),
  })

  const { write: placeBidWrite, data: placeBidTx, isLoading: isPlacing, error: placeBidWriteError } = useContractWrite(placeBidConfig)
  const { isLoading: isBidPending, isSuccess: bidSuccess } = useWaitForTransaction({ hash: placeBidTx?.hash })

  useEffect(() => {
    if (bidSuccess) {
      setBidPlain('')
      setDepositEth('')
      refetch()
    }
  }, [bidSuccess, refetch])

  // -------- Phase transition actions --------
  const canTransitionToReveal = info && info.phase === 1 && now >= info.biddingEnd
  const canReveal = info && info.phase === 2 && now < info.revealEnd
  const canFinalize = info && info.phase === 2 && now >= info.revealEnd

  const { config: ttrConfig } = usePrepareContractWrite({ address, abi: fheAuctionAbi, functionName: 'transitionToReveal', enabled: Boolean(address && canTransitionToReveal) })
  const { write: ttrWrite, data: ttrTx, isLoading: isTtrLoading } = useContractWrite(ttrConfig)
  const { isLoading: isTtrPending, isSuccess: ttrSuccess } = useWaitForTransaction({ hash: ttrTx?.hash })

  useEffect(() => { if (ttrSuccess) refetch() }, [ttrSuccess, refetch])

  const { config: revealConfig } = usePrepareContractWrite({ address, abi: fheAuctionAbi, functionName: 'revealBid', enabled: Boolean(address && canReveal) })
  const { write: revealWrite, data: revealTx, isLoading: isRevealLoading } = useContractWrite(revealConfig)
  const { isLoading: isRevealPending, isSuccess: revealSuccess } = useWaitForTransaction({ hash: revealTx?.hash })
  useEffect(() => { if (revealSuccess) refetch() }, [revealSuccess, refetch])

  const { config: finalizeConfig } = usePrepareContractWrite({ address, abi: fheAuctionAbi, functionName: 'finalizeAuction', enabled: Boolean(address && canFinalize) })
  const { write: finalizeWrite, data: finalizeTx, isLoading: isFinalizeLoading } = useContractWrite(finalizeConfig)
  const { isLoading: isFinalizePending, isSuccess: finalizeSuccess } = useWaitForTransaction({ hash: finalizeTx?.hash })
  useEffect(() => { if (finalizeSuccess) refetch() }, [finalizeSuccess, refetch])

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Auction Details</h1>
        <div className="flex gap-2">
          <button className="btn-secondary" onClick={() => router.back()}>Back</button>
          <button className="btn-secondary" onClick={() => refetch()}>Refresh</button>
        </div>
      </div>

      {!address && (
        <div className="text-red-600">Invalid address.</div>
      )}

      {isLoading && <p className="text-gray-600">Loading...</p>}
      {isError && <p className="text-red-600">Failed to load auction.</p>}

      {info && (
        <div className="card">
          <div className="mb-4">
            <p className="text-xs uppercase text-gray-500">Address</p>
            <p className="font-mono break-all">{address}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-800">
            <div>
              <div className="text-gray-500 text-xs uppercase">Seller</div>
              <div className="font-mono break-all">{info.seller}</div>
            </div>
            <div>
              <div className="text-gray-500 text-xs uppercase">Asset Type</div>
              <div>{info.assetType === 0 ? 'ERC721' : info.assetType === 1 ? 'ERC1155' : 'ERC20'}</div>
            </div>
            <div>
              <div className="text-gray-500 text-xs uppercase">Asset Contract</div>
              <div className="font-mono break-all">{info.assetContract}</div>
            </div>
            <div>
              <div className="text-gray-500 text-xs uppercase">Token ID</div>
              <div>{info.tokenId}</div>
            </div>
            <div>
              <div className="text-gray-500 text-xs uppercase">Amount</div>
              <div>{info.amount}</div>
            </div>
            <div>
              <div className="text-gray-500 text-xs uppercase">Phase</div>
              <div>{info.phase === 0 ? 'Created' : info.phase === 1 ? 'Bidding' : info.phase === 2 ? 'Reveal' : info.phase === 3 ? 'Finalized' : 'Cancelled'}</div>
            </div>
            <div>
              <div className="text-gray-500 text-xs uppercase">Start Time</div>
              <div>{new Date(info.startTime * 1000).toLocaleString()}</div>
            </div>
            <div>
              <div className="text-gray-500 text-xs uppercase">Bidding Ends</div>
              <div>
                {new Date(info.biddingEnd * 1000).toLocaleString()}
                <span className="ml-2 text-gray-500">
                  {now < info.biddingEnd ? `(${formatCountdown(info.biddingEnd - now)} left)` : '(ended)'}
                </span>
              </div>
            </div>
            <div>
              <div className="text-gray-500 text-xs uppercase">Reveal Ends</div>
              <div>
                {new Date(info.revealEnd * 1000).toLocaleString()}
                <span className="ml-2 text-gray-500">
                  {now < info.revealEnd ? `(${formatCountdown(info.revealEnd - now)} left)` : '(ended)'}
                </span>
              </div>
            </div>
          </div>

          {/* Status row */}
          <div className="mt-4 flex flex-wrap gap-4 text-sm">
            <div className="px-3 py-2 bg-gray-50 border rounded">Bidder count: <strong>{bidderCount}</strong></div>
            {account && (
              <div className="px-3 py-2 bg-gray-50 border rounded">
                Your deposit: <strong>{myBid ? (Number(myBid.depositAmount) > 0 ? `${formatEth(myBid.depositAmount)} ETH` : '—') : '—'}</strong>
                <span className="ml-3">Revealed: <strong>{myBid ? (myBid.isRevealed ? 'Yes' : 'No') : '—'}</strong></span>
              </div>
            )}
          </div>

          {/* Bid section (hidden if user already bid) */}
          {!hasMyBid && (
            <div className="mt-6 border-t pt-6">
              <h2 className="text-lg font-semibold mb-3">Place a Bid</h2>
              <p className="text-sm text-gray-600 mb-3">Enter your bid amount (plain, demo) and an ETH deposit (escrow). Bidding open only during phase Bidding.</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="label">Bid Amount (uint)</label>
                  <input
                    className="input"
                    placeholder="e.g. 100"
                    value={bidPlain}
                    onChange={(e) => setBidPlain(e.target.value)}
                  />
                  {!bidPlain ? (
                    <div className="text-xs text-gray-500 mt-1">Required</div>
                  ) : !/^\d+$/.test(bidPlain) ? (
                    <div className="text-xs text-red-600 mt-1">Must be an integer</div>
                  ) : undefined}
                </div>
                <div>
                  <label className="label">Deposit (ETH)</label>
                  <input
                    className="input"
                    placeholder="e.g. 0.01"
                    value={depositEth}
                    onChange={(e) => setDepositEth(e.target.value)}
                  />
                  {!depositEth ? (
                    <div className="text-xs text-gray-500 mt-1">Required</div>
                  ) : !/^(?:\d+)(?:\.\d+)?$/.test(depositEth) ? (
                    <div className="text-xs text-red-600 mt-1">Enter a positive number</div>
                  ) : Number(depositEth) <= 0 ? (
                    <div className="text-xs text-red-600 mt-1">Must be greater than 0</div>
                  ) : undefined}
                </div>
                <div className="flex items-end">
                  <button
                    className="btn-primary w-full"
                    disabled={!biddingOpen || !placeBidWrite}
                    onClick={() => placeBidWrite?.()}
                  >
                    {isPlacing ? 'Submitting...' : isBidPending ? 'Confirming...' : 'Place Bid'}
                  </button>
                </div>
              </div>
              {(placeBidPrepareError || placeBidWriteError) && (
                <div className="mt-2 text-red-600 text-sm">{(placeBidPrepareError || placeBidWriteError)?.message}</div>
              )}
            </div>
          )}

          {/* Actions for phases */}
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              className="btn-secondary"
              disabled={!ttrWrite || isTtrLoading || isTtrPending}
              onClick={() => ttrWrite?.()}
            >
              {isTtrLoading ? 'Submitting...' : isTtrPending ? 'Confirming...' : 'Transition to Reveal'}
            </button>
            <button
              className="btn-secondary"
              disabled={!revealWrite || isRevealLoading || isRevealPending || !hasMyBid || (myBid?.isRevealed ?? false)}
              onClick={() => revealWrite?.()}
            >
              {myBid?.isRevealed ? 'Already Revealed' : (isRevealLoading ? 'Submitting...' : isRevealPending ? 'Confirming...' : 'Reveal My Bid')}
            </button>
            <button
              className="btn-secondary"
              disabled={!finalizeWrite || isFinalizeLoading || isFinalizePending}
              onClick={() => finalizeWrite?.()}
            >
              {isFinalizeLoading ? 'Submitting...' : isFinalizePending ? 'Confirming...' : 'Finalize Auction'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
