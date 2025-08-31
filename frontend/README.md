# FHE Auction Frontend

A Next.js frontend for the FHE (Fully Homomorphic Encryption) Auction dApp.

## Features

- 🎯 Browse active auctions
- 🚀 Create new auctions
- 🔐 Wallet connection with RainbowKit
- 📱 Responsive design with Tailwind CSS
- ⚡ Fast development with Next.js 14

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   Create a `.env.local` file:
   ```env
       NEXT_PUBLIC_LISK_SEPOLIA_RPC_URL=https://rpc.sepolia-api.lisk.com
   NEXT_PUBLIC_FACTORY_ADDRESS=YOUR_DEPLOYED_FACTORY_ADDRESS
   ```

3. **Get WalletConnect Project ID:**
   - Go to [WalletConnect Cloud](https://cloud.walletconnect.com/)
   - Create a new project
   - Copy the Project ID
   - Update `app/providers.tsx` with your Project ID

4. **Run the development server:**
   ```bash
   npm run dev
   ```

5. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Project Structure

```
frontend/
├── app/
│   ├── components/          # React components
│   │   ├── Header.tsx      # App header
│   │   ├── AuctionList.tsx # Browse auctions
│   │   └── CreateAuction.tsx # Create new auction
│   ├── globals.css         # Global styles
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Main page
│   └── providers.tsx       # Web3 providers
├── package.json            # Dependencies
└── tailwind.config.js      # Tailwind configuration
```

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS
- **Web3:** Wagmi + RainbowKit
- **Blockchain:** Zama Network (FHE-enabled)
- **Language:** TypeScript

## Next Steps

1. **Connect to Smart Contracts:**
   - Deploy your contracts to Zama devnet
   - Update contract addresses in environment variables
   - Implement contract interaction functions

2. **Add FHE Integration:**
   - Integrate with Zama's FHE library
   - Implement encrypted bid submission
   - Add bid reveal functionality

3. **Enhance UX:**
   - Add loading states
   - Implement error handling
   - Add transaction notifications

## Deployment

Build for production:
```bash
npm run build
npm start
```

Deploy to Vercel:
```bash
npm install -g vercel
vercel
```
