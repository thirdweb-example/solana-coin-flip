import { NextRequest, NextResponse } from 'next/server'
import { getBalance } from '@/lib/thirdweb'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const address = searchParams.get('address')
    const label = searchParams.get('label')

    if (!address) {
      return NextResponse.json({ error: 'Address required' }, { status: 400 })
    }
    
    const balanceData = await getBalance(address, label || undefined)

    const response = {
      balance: balanceData.balance || balanceData.displayValue || '0',
      address: address,
      label: label || null,
    }

    return NextResponse.json(response)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to get balance' },
      { status: 500 }
    )
  }
}

