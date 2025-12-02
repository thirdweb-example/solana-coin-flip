# Solana Coin Flip Game

A simple coin flip game built on Solana Devnet using Next.js and Thirdweb.

## Features

- User authentication with Thirdweb in-app wallet (email/OTP)
- Wallet creation via Thirdweb API
- Coin flip game using Solana slot hash for randomness
- Automatic fund transfers based on game results

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables in `.env.local`:
```
NEXT_PUBLIC_THIRDWEB_CLIENT_ID=your_thirdweb_client_id
THIRDWEB_API_KEY=your_thirdweb_secret_key
NEXT_PUBLIC_SOLANA_NETWORK=devnet
```

3. Get your Thirdweb credentials:
   - Go to [Thirdweb Dashboard](https://thirdweb.com)
   - Create a new project or use existing one
   - Get your **Client ID** (for authentication)
   - Get your **Secret Key** (for API calls)

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## How It Works

1. User signs in with email via Thirdweb in-app wallet (receives OTP code)
2. An EVM wallet is automatically created and connected
3. A Solana wallet is created via Thirdweb API using the EVM wallet address as the label
4. User selects heads or tails and enters a stake amount
5. Coin flip result is determined using the latest Solana slot hash (last byte mod 2)
6. If user wins: treasury wallet sends 2x stake to user's Solana wallet
7. If user loses: user's Solana wallet sends stake to treasury wallet
8. UI updates with result and new balances

## Notes

- All transactions happen on Solana Devnet
- Treasury wallet address: `GL4PXGcmYPjpUsNg7RYqxwCypggnq3smfXwjZx2ktP5i`
- Make sure your treasury wallet has enough SOL for payouts
- The game uses Solana's blockhash for provably fair randomness
- EVM wallet address is used as the unique identifier for each user
