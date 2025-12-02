import { NextRequest, NextResponse } from 'next/server'
import { sendTransaction, getBalance } from '@/lib/thirdweb'

// Get latest Solana slot hash
async function getLatestSlotHash() {
  try {
    const response = await fetch('https://api.devnet.solana.com', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'getLatestBlockhash',
      }),
    })

    const data = await response.json()
    
    // Solana API returns blockhash in data.result.value.blockhash
    const blockhash = data.result?.value?.blockhash || data.result?.blockhash
    
    if (!blockhash) {
      throw new Error('Invalid blockhash response from Solana')
    }
    
    return blockhash
  } catch (error) {
    throw error
  }
}

// Determine heads (0) or tails (1) from slot hash, timestamp, and user address
function getCoinFlipResult(slotHash: string, timestamp: number, userAddress: string): 'heads' | 'tails' {
  if (!slotHash || typeof slotHash !== 'string') {
    throw new Error('Invalid slot hash provided')
  }
  
  if (slotHash.length < 2) {
    throw new Error('Slot hash is too short')
  }
  
  // Use multiple characters from hash for better distribution
  // Take characters from different positions: last, middle, and second-to-last
  const lastChar = slotHash.slice(-1)
  const middleChar = slotHash[Math.floor(slotHash.length / 2)]
  const secondLastChar = slotHash.slice(-2, -1)
  
  // Get character codes from hash
  const hashValue1 = lastChar.charCodeAt(0)
  const hashValue2 = middleChar.charCodeAt(0)
  const hashValue3 = secondLastChar.charCodeAt(0)
  
  // Get timestamp components for more entropy
  const timestampMs = timestamp % 1000 // Milliseconds (0-999)
  const timestampSec = Math.floor(timestamp / 1000) % 60 // Seconds (0-59)
  
  // Use user address for additional randomness (random positions based on hash)
  // Use hash length and timestamp to determine random positions
  const addressLength = userAddress.length
  const randomPos1 = (hashValue1 + timestampMs) % addressLength
  const randomPos2 = (hashValue2 + timestampSec) % addressLength
  const addressValue1 = userAddress.charCodeAt(randomPos1) || 0
  const addressValue2 = userAddress.charCodeAt(randomPos2) || 0
  
  // Combine all values for maximum randomness
  const combinedValue = (
    hashValue1 +
    hashValue2 +
    hashValue3 +
    timestampMs +
    timestampSec +
    addressValue1 +
    addressValue2
  ) % 2
  
  const result = combinedValue === 0 ? 'heads' : 'tails'
  
  return result
}

export async function POST(request: NextRequest) {
  try {
    const { evmAddress, choice, stake, userLabel, userAddress, serverLabel, serverAddress } = await request.json()

    if (!evmAddress || !choice || !stake || !userLabel || !userAddress || !serverLabel || !serverAddress) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const stakeAmount = parseFloat(stake)
    
    // Check user balance first - ensure they have enough
    const balanceData = await getBalance(userAddress, userLabel)
    const userBalance = parseFloat(balanceData.balance || balanceData.displayValue || balanceData.value || '0')
    
    if (userBalance < stakeAmount) {
      return NextResponse.json(
        { error: `Insufficient balance. You have ${userBalance.toFixed(4)} SOL but need ${stakeAmount.toFixed(4)} SOL` },
        { status: 400 }
      )
    }

    // Step 1: Take stake from user BEFORE the game starts
    const stakeTransaction = await sendTransaction(userAddress, serverAddress, stakeAmount)

    // Step 2: Get latest slot hash and determine result
    const slotHash = await getLatestSlotHash()
    const timestamp = Date.now()
    const result = getCoinFlipResult(slotHash, timestamp, userAddress)

    // Step 3: If user wins, send double from server (stake * 2)
    let winTransaction = null
    if (result === choice) {
      const winAmount = stakeAmount * 2 // Double the stake
      winTransaction = await sendTransaction(serverAddress, userAddress, winAmount)
    }
    
    return NextResponse.json({
      result,
      won: result === choice,
      stakeTransaction,
      winTransaction,
      slotHash,
      timestamp,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to process coin flip' },
      { status: 500 }
    )
  }
}

