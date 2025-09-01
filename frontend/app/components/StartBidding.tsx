'use client'

import { useEffect, useMemo, useState } from 'react'
import { useAccount, useContractRead, useContractReads, useContractWrite, usePrepareContractWrite, useWaitForTransaction } from 'wagmi'
import { auctionFactoryAbi } from '../abi/auctionFactory'
import { fheAuctionAbi } from '../abi/fheAuction'
import { erc20Abi } from '../abi/erc20'

const FACTORY_ADDRESS = process.env.NEXT_PUBLIC_FACTORY_ADDRESS as `0x${string}` | undefined

export function StartBidding() {
  const { address: account } = useAccount()
  const [showAll, setShowAll] = useState(false)

  // 1) Read all auctions from the factory
  const { data: allAuctions } = useContractRead({
    address: FACTORY_ADDRESS,
    abi: auctionFactoryAbi,
    functionName: 'getAllAuctions',
    enabled: Boolean(FACTORY_ADDRESS),
  })

  const auctionAddresses = (allAuctions as `0x${string}`[] | undefined) || []

  // 2) Batch read getAuctionInfo() for each auction
  const { data: infos, refetch, isFetching } = useContractReads({
    contracts: auctionAddresses.map((addr) => ({
      address: addr,
      abi: fheAuctionAbi,
      functionName: 'getAuctionInfo',
    })),
    enabled: auctionAddresses.length > 0,
    allowFailure: true,
  })

  // Shape data for display
  const items = useMemo(() => {
    const now = Math.floor(Date.now() / 1000)
    return auctionAddresses.map((addr, i) => {
      const res = infos?.[i] as any
      if (!res || res.status === 'failure') return null
      const [seller, assetType, assetContract, tokenId, amount, startTime, biddingEnd, revealEnd, phase] = res.result as [
        `0x${string}`, number, `0x${string}`, bigint, bigint, bigint, bigint, bigint, number
      ]
      const canStart = phase === 0 && Number(startTime) <= now && seller?.toLowerCase() === account?.toLowerCase()
      return {
        address: addr,
        seller,
        assetType,
        assetContract,
        tokenId: tokenId.toString(),
        amount: amount.toString(),
        amountRaw: amount,
        startTime: Number(startTime),
        biddingEnd: Number(biddingEnd),
        revealEnd: Number(revealEnd),
        phase,
        canStart,
      }
    }).filter(Boolean) as Array<{
      address: `0x${string}`
      seller: `0x${string}`
      assetType: number
      assetContract: `0x${string}`
      tokenId: string
      amount: string
      amountRaw: bigint
      startTime: number
      biddingEnd: number
      revealEnd: number
      phase: number
      canStart: boolean
    }>
  }, [auctionAddresses, infos, account])

  // 3) Prepare write for startBidding on a selected auction
  const [target, setTarget] = useState<`0x${string}` | undefined>()

  const { config, error: prepareError } = usePrepareContractWrite({
    address: target,
    abi: fheAuctionAbi,
    functionName: 'startBidding',
    enabled: Boolean(target),
  })

  const { write, data: txData, isLoading: isWriting, error: writeError } = useContractWrite(config)
  const { isLoading: isPending, isSuccess } = useWaitForTransaction({ hash: txData?.hash })

  useEffect(() => {
    if (target && write && !isWriting && !isPending) {
      // trigger the transaction once the config/write is ready for the selected target
      write()
    }
  }, [target, write, isWriting, isPending])

  useEffect(() => {
    if (isSuccess) {
      refetch()
      // clear target after success
      setTarget(undefined)
    }
  }, [isSuccess, refetch])

  // --- ERC20 Approve flow ---
  const [approveReq, setApproveReq] = useState<{
    token: `0x${string}`
    spender: `0x${string}`
    amount: bigint
  } | undefined>()

  const { config: approveConfig, error: approvePrepareError } = usePrepareContractWrite({
    address: approveReq?.token,
    abi: erc20Abi,
    functionName: 'approve',
    args: approveReq ? [approveReq.spender, approveReq.amount] : undefined,
    enabled: Boolean(approveReq),
  })

  const { write: approveWrite, data: approveTx, isLoading: isApproving, error: approveWriteError } = useContractWrite(approveConfig)
  const { isLoading: isApprovePending, isSuccess: approveSuccess } = useWaitForTransaction({ hash: approveTx?.hash })

  useEffect(() => {
    if (approveReq && approveWrite && !isApproving && !isApprovePending) {
      approveWrite()
    }
  }, [approveReq, approveWrite, isApproving, isApprovePending])

  useEffect(() => {
    if (approveSuccess) {
      // refresh to reflect allowance changes if we later add checks
      refetch()
      setApproveReq(undefined)
    }
  }, [approveSuccess, refetch])

  const list = useMemo(() => {
    if (showAll) return items
    return items.filter((it) => it.seller?.toLowerCase() === account?.toLowerCase() && it.phase === 0)
  }, [items, showAll, account])

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Manage Auctions - Start Bidding</h2>
        <div className="flex items-center gap-2">
          <button
            className={`btn-secondary px-3 ${showAll ? '' : 'ring-2 ring-primary-600'}`}
            onClick={() => setShowAll(false)}
          >
            Mine (Created)
          </button>
          <button
            className={`btn-secondary px-3 ${showAll ? 'ring-2 ring-primary-600' : ''}`}
            onClick={() => setShowAll(true)}
          >
            Show All
          </button>
          <button className="btn-secondary" onClick={() => refetch()} disabled={isFetching}>Refresh</button>
        </div>
      </div>

      <p className="text-sm text-gray-600 mb-4">
        You can only start bidding for auctions you created, after the configured start time. Ensure the auction
        contract is approved to transfer your asset (for ERC721/1155 via setApprovalForAll; for ERC20 via allowance).
      </p>

      <div className="space-y-4">
        {list.map((it) => {
          const rowWriting = isWriting && target === it.address
          const rowPending = isPending && target === it.address
          const rowApproving = isApproving && approveReq?.spender === it.address
          const rowApprovePending = isApprovePending && approveReq?.spender === it.address
          return (
          <div key={it.address} className="card flex items-start justify-between gap-4">
            <div className="flex-1">
              <p className="text-xs uppercase text-gray-500">Auction</p>
              <p className="font-mono break-all">{it.address}</p>
              <div className="mt-2 grid grid-cols-2 gap-2 text-sm text-gray-700">
                <div>Phase: {it.phase === 0 ? 'Created' : it.phase}</div>
                <div>Start: {new Date(it.startTime * 1000).toLocaleString()}</div>
                <div>Asset: {it.assetContract}</div>
                <div>Token ID: {it.tokenId}</div>
              </div>
            </div>
            <div className="w-48 flex flex-col gap-2">
              {it.assetType === 2 && (
                <button
                  className="btn-secondary w-full"
                  disabled={rowApproving || rowApprovePending}
                  onClick={() => setApproveReq({ token: it.assetContract, spender: it.address, amount: it.amountRaw })}
                >
                  {rowApproving ? 'Approving...' : rowApprovePending ? 'Waiting...' : 'Approve ERC20'}
                </button>
              )}
              <button
                className="btn-primary w-full"
                disabled={!it.canStart || rowWriting || rowPending}
                onClick={() => { setTarget(it.address) }}
              >
                {rowWriting ? 'Submitting...' : rowPending ? 'Confirming...' : 'Start Bidding'}
              </button>
            </div>
          </div>
          )
        })}
      </div>

      {list.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No auctions ready to start. Create one or wait for start time.</p>
        </div>
      )}

      {(prepareError || writeError || approvePrepareError || approveWriteError) && (
        <div className="mt-4 text-red-600 text-sm">
          {(prepareError || writeError || approvePrepareError || approveWriteError)?.message}
        </div>
      )}
    </div>
  )
}
