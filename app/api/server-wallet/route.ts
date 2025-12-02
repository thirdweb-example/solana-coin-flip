import { NextRequest, NextResponse } from 'next/server'
import { getBalance } from '@/lib/thirdweb'

const TREASURY_WALLET_ADDRESS = 'GL4PXGcmYPjpUsNg7RYqxwCypggnq3smfXwjZx2ktP5i'
const TREASURY_LABEL = 'treasury_wallet'

export async function GET(request: NextRequest) {
  try {
    // Try to get balance, but don't fail if it doesn't work (treasury wallet might not be in Thirdweb)
    let balance = '0'
    try {
      const balanceData = await getBalance(TREASURY_WALLET_ADDRESS, TREASURY_LABEL)
      balance = balanceData.balance || balanceData.displayValue || balanceData.value || '0'
    } catch (error: any) {
      // Treasury wallet is not managed by Thirdweb, so we can't get balance via API
      // Just return the address with 0 balance
    }

    return NextResponse.json({
      address: TREASURY_WALLET_ADDRESS,
      label: TREASURY_LABEL,
      balance: balance,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to get server wallet' },
      { status: 500 }
    )
  }
}

