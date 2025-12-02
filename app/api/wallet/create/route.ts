import { NextRequest, NextResponse } from 'next/server'
import { createWallet, getWalletByLabel } from '@/lib/thirdweb'

export async function POST(request: NextRequest) {
  try {
    const { evmAddress } = await request.json()

    if (!evmAddress) {
      return NextResponse.json({ error: 'EVM address required' }, { status: 400 })
    }

    // Use EVM address as label for Solana wallet
    const label = evmAddress

    // Check if wallet already exists in Thirdweb by label
    const existingWallet = await getWalletByLabel(label)

    if (existingWallet && existingWallet.address) {
      return NextResponse.json({
        address: existingWallet.address,
        label: existingWallet.label || label,
      })
    }

    // Create wallet via Thirdweb
    const walletData = await createWallet(label)

    // walletData is already unwrapped (result object)
    return NextResponse.json({
      address: walletData.address,
      label: walletData.label || label,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to create wallet' },
      { status: 500 }
    )
  }
}

