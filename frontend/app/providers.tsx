'use client'

import { RainbowKitProvider, getDefaultWallets } from '@rainbow-me/rainbowkit'
import { configureChains, createConfig, WagmiConfig } from 'wagmi'
import { jsonRpcProvider } from 'wagmi/providers/jsonRpc'
import '@rainbow-me/rainbowkit/styles.css'

// RPC from env with safe fallback
const RPC_URL = (process.env.NEXT_PUBLIC_LISK_SEPOLIA_RPC_URL as string) || 'https://rpc.sepolia-api.lisk.com'

// Custom Lisk Sepolia chain (id 4202)
const liskSepolia = {
  id: 4202,
  name: 'Lisk Sepolia',
  network: 'lisk-sepolia',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: [RPC_URL] },
    public: { http: [RPC_URL] },
  },
  blockExplorers: {
    default: { name: 'Blockscout', url: 'https://sepolia-blockscout.lisk.com' },
  },
} as const

const { chains, publicClient, webSocketPublicClient } = configureChains(
  [liskSepolia],
  [
    jsonRpcProvider({
      rpc: (chain) => (chain.id === 4202 ? { http: RPC_URL } : null),
    }),
  ]
)

const { connectors } = getDefaultWallets({
  appName: 'FHE Auction dApp',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'WALLETCONNECT_PROJECT_ID',
  chains,
})

const wagmiConfig = createConfig({
  autoConnect: true,
  connectors,
  publicClient,
  webSocketPublicClient,
})

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiConfig config={wagmiConfig}>
      <RainbowKitProvider chains={chains}>
        {children}
      </RainbowKitProvider>
    </WagmiConfig>
  )
}
