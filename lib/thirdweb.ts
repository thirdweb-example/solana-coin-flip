const THIRDWEB_API_KEY = process.env.THIRDWEB_API_KEY!
const SOLANA_NETWORK = process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'devnet'
const THIRDWEB_BASE_URL = 'https://api.thirdweb.com/v1'

export async function createWallet(label: string) {
  const response = await fetch(`${THIRDWEB_BASE_URL}/solana/wallets`, {
    method: 'POST',
    headers: {
      'x-secret-key': THIRDWEB_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      label,
      network: SOLANA_NETWORK,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to create wallet: ${error}`)
  }

  const data = await response.json()
  // Handle result wrapper
  return data.result || data
}

export async function getWalletByLabel(label: string) {
  const response = await fetch(`${THIRDWEB_BASE_URL}/solana/wallets?label=${encodeURIComponent(label)}`, {
    method: 'GET',
    headers: {
      'x-secret-key': THIRDWEB_API_KEY,
    },
  })

  if (!response.ok) {
    return null
  }

  const data = await response.json()
  // Handle result wrapper
  const wallets = data.result || data
  // Thirdweb returns an array, find the wallet with matching label
  if (Array.isArray(wallets) && wallets.length > 0) {
    return wallets.find((w: any) => w.label === label) || wallets[0]
  }
  return wallets
}

export async function getBalance(address: string, label?: string) {
  const chainId = SOLANA_NETWORK === 'devnet' ? 'solana:devnet' : 'solana:mainnet'
  const url = `${THIRDWEB_BASE_URL}/solana/wallets/${address}/balance?chainId=${chainId}`
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'x-secret-key': THIRDWEB_API_KEY,
    },
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to get balance: ${error}`)
  }

  const data = await response.json()
  
  // Handle result wrapper - format matches: { result: { chainId, decimals, displayValue, value } }
  const result = data.result || data
  const balanceResult = {
    balance: result.displayValue || result.value || '0',
    chainId: result.chainId,
    decimals: result.decimals,
    displayValue: result.displayValue,
    value: result.value,
  }
  
  return balanceResult
}

export async function sendTransaction(fromAddress: string, toAddress: string, amount: number) {
  const chainId = SOLANA_NETWORK === 'devnet' ? 'solana:devnet' : 'solana:mainnet'
  
  // Convert SOL to lamports (1 SOL = 1,000,000,000 lamports)
  const amountInLamports = Math.floor(amount * 1_000_000_000).toString()
  
  const response = await fetch(`${THIRDWEB_BASE_URL}/solana/send`, {
    method: 'POST',
    headers: {
      'x-secret-key': THIRDWEB_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: fromAddress,
      to: toAddress,
      amount: amountInLamports,
      chainId: chainId,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to send transaction: ${error}`)
  }

  const data = await response.json()
  // Handle result wrapper
  return data.result || data
}

