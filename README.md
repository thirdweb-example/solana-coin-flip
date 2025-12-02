# Solana Coin Flip Game

A simple coin flip game built on Solana Devnet using Next.js and **thirdweb's Solana Server Wallet and Transaction API**.

## 🚀 Powered by thirdweb

This project leverages **thirdweb's Solana Server Wallet API** for secure server-side wallet management and **thirdweb's Solana Transaction API** for on-chain transactions. All wallet operations and fund transfers are handled through thirdweb's infrastructure.

### Key thirdweb Features Used:
- **Solana Server Wallet API** - Creates and manages Solana wallets server-side
- **Solana Transaction API** - Handles all on-chain transactions (sending/receiving SOL)
- **thirdweb In-App Wallet** - User authentication via email/OTP
- **Balance API** - Real-time wallet balance queries

## Features

- User authentication with thirdweb in-app wallet (email/OTP)
- **Server-side Solana wallet creation via thirdweb API**
- **On-chain transactions via thirdweb Transaction API**
- Coin flip game using Solana slot hash for randomness
- Automatic fund transfers based on game results

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables in `.env.local`:
```
NEXT_PUBLIC_thirdweb_CLIENT_ID=your_thirdweb_client_id
thirdweb_API_KEY=your_thirdweb_secret_key
NEXT_PUBLIC_SOLANA_NETWORK=devnet
```

3. Get your thirdweb credentials:
   - Go to [thirdweb Dashboard](https://thirdweb.com)
   - Create a new project or use existing one
   - Get your **Client ID** (for authentication)
   - Get your **Secret Key** (for API calls)

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## How It Works

1. User signs in with email via thirdweb in-app wallet (receives OTP code)
2. An EVM wallet is automatically created and connected
3. **A Solana wallet is created server-side via thirdweb's Server Wallet API** using the EVM wallet address as the label
4. User selects heads or tails and enters a stake amount
5. Coin flip result is determined using the latest Solana slot hash (enhanced with timestamp and address randomness)
6. **All transactions are processed via thirdweb's Transaction API:**
   - If user wins: treasury wallet sends 2x stake to user's Solana wallet
   - If user loses: user's Solana wallet sends stake to treasury wallet
7. UI updates with result and new balances (fetched via thirdweb's Balance API)

## Notes

- All transactions happen on Solana Devnet
- **All wallet operations use thirdweb's Server Wallet API** - wallets are created and managed server-side
- **All transactions use thirdweb's Transaction API** (`/solana/send` endpoint)
- Treasury wallet address: `GL4PXGcmYPjpUsNg7RYqxwCypggnq3smfXwjZx2ktP5i`
- Make sure your treasury wallet has enough SOL for payouts
- The game uses Solana's blockhash (enhanced with timestamp and address randomness) for provably fair randomness
- EVM wallet address is used as the unique identifier for each user

## thirdweb API Endpoints Used

- `POST /v1/solana/wallets` - Create server-side Solana wallets
- `GET /v1/solana/wallets/{address}/balance` - Get wallet balance
- `POST /v1/solana/send` - Send SOL transactions
- `GET /v1/solana/wallets?label={label}` - Query wallets by label
