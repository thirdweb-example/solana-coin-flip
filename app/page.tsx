'use client'

import { useState, useEffect } from 'react'
import { useConnect, useActiveAccount, useDisconnect, useAutoConnect } from 'thirdweb/react'
import { inAppWallet } from 'thirdweb/wallets'
import { preAuthenticate } from 'thirdweb/wallets/in-app'
import { client } from '@/lib/thirdweb-client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Coins, Wallet, LogOut, RefreshCw, Trophy, XCircle, Sparkles } from 'lucide-react'
import Image from 'next/image'
import solLogo from './sol.png'

const wallet = inAppWallet()

export default function Home() {
  const { connect } = useConnect()
  const account = useActiveAccount()
  const { disconnect } = useDisconnect()
  
  // Auto-connect on page load
  useAutoConnect({
    client,
    wallets: [wallet],
  })
  
  const [loading, setLoading] = useState(true)
  const [walletAddress, setWalletAddress] = useState<string>('')
  const [walletLabel, setWalletLabel] = useState<string>('')
  const [balance, setBalance] = useState<string>('0')
  const [serverWallet, setServerWallet] = useState<string>('')
  const [serverWalletLabel, setServerWalletLabel] = useState<string>('')
  const [serverBalance, setServerBalance] = useState<string>('0')
  const [choice, setChoice] = useState<'heads' | 'tails' | null>(null)
  const [stake, setStake] = useState<string>('0.1')
  const [gameResult, setGameResult] = useState<any>(null)
  const [processing, setProcessing] = useState(false)
  const [coinResult, setCoinResult] = useState<'heads' | 'tails' | null>(null)
  
  // Auth states
  const [email, setEmail] = useState<string>('')
  const [verificationCode, setVerificationCode] = useState<string>('')
  const [otpSent, setOtpSent] = useState<boolean>(false)
  const [authLoading, setAuthLoading] = useState<boolean>(false)
  const [authError, setAuthError] = useState<string>('')

  useEffect(() => {
    getServerWallet()
    // Wait a bit for auto-connect to complete
    const timer = setTimeout(() => {
      if (account?.address) {
        createOrGetWallet(account.address)
      }
      setLoading(false)
    }, 500)
    
    return () => clearTimeout(timer)
  }, [account])

  useEffect(() => {
    if (account?.address && walletAddress) {
      refreshBalance()
    }
  }, [account, walletAddress])

  async function createOrGetWallet(evmAddress: string) {
    try {
      const response = await fetch('/api/wallet/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ evmAddress }),
      })
      const data = await response.json()
      if (data.address) {
        setWalletAddress(data.address)
        setWalletLabel(data.label)
      }
    } catch (error) {
      // Error handled by UI state
    }
  }

  async function refreshBalance() {
    if (!walletAddress) return
    try {
      const url = `/api/wallet/balance?address=${walletAddress}${walletLabel ? `&label=${walletLabel}` : ''}`
      const response = await fetch(url)
      const data = await response.json()
      setBalance(data.balance || '0')
    } catch (error) {
      // Error handled by UI state
    }
  }

  async function getServerWallet() {
    try {
      const response = await fetch('/api/server-wallet')
      const data = await response.json()
      if (data.address) {
        setServerWallet(data.address)
        setServerWalletLabel(data.label)
        setServerBalance(data.balance || '0')
      }
    } catch (error) {
      // Error getting server wallet
    }
  }

  async function sendOtp(e: React.FormEvent) {
    e.preventDefault()
    setAuthLoading(true)
    setAuthError('')

    try {
      await preAuthenticate({
        client,
        strategy: 'email',
        email,
      })
      setOtpSent(true)
      setAuthError('')
    } catch (error: any) {
      setAuthError(error.message || 'Failed to send verification code')
    } finally {
      setAuthLoading(false)
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setAuthLoading(true)
    setAuthError('')

    try {
      await connect(async () => {
        await wallet.connect({
          client,
          strategy: 'email',
          email,
          verificationCode,
        })
        return wallet
      })
      setOtpSent(false)
      setEmail('')
      setVerificationCode('')
    } catch (error: any) {
      setAuthError(error.message || 'Failed to connect wallet')
    } finally {
      setAuthLoading(false)
    }
  }

  async function handleDisconnect() {
    try {
      await disconnect(wallet)
    } catch (error) {
      // Error handled silently
    }
    setWalletAddress('')
    setBalance('0')
    setGameResult(null)
    setOtpSent(false)
    setEmail('')
    setVerificationCode('')
  }

  async function handleFlip() {
    if (!choice || !stake || !account?.address || !walletAddress || !walletLabel || !serverWallet || !serverWalletLabel) {
      setAuthError('Please select heads or tails and enter a stake amount')
      return
    }

    // Reset for new game
    setGameResult(null)
    setCoinResult(null)
    setAuthError('')
    setProcessing(true)

    try {
      const response = await fetch('/api/game/flip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          evmAddress: account.address,
          choice,
          stake,
          userLabel: walletLabel,
          userAddress: walletAddress,
          serverLabel: serverWalletLabel,
          serverAddress: serverWallet,
        }),
      })

      const data = await response.json()

      if (data.error) {
        setAuthError(data.error)
        setProcessing(false)
      } else {
        setGameResult(data)
        setCoinResult(data.result) // Store the result to show on coin
        setProcessing(false)
        refreshBalance()
        getServerWallet()
      }
    } catch (error: any) {
      setAuthError(error.message || 'Failed to process coin flip')
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <Sparkles className="h-12 w-12 animate-spin mx-auto text-orange-500 mb-4" />
          <p className="text-lg text-orange-500">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Disclaimer Banner */}
        <div className="mb-6 p-4 rounded-lg bg-gradient-to-r from-orange-900/30 to-orange-800/20 border-2 border-orange-500/50 shadow-lg">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              <XCircle className="w-5 h-5 text-orange-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-orange-400 font-bold text-sm mb-1">DISCLAIMER</h3>
              <p className="text-orange-300/90 text-xs leading-relaxed">
                This is an example template for demonstration purposes only. This is not a real gambling platform. 
                No real money or cryptocurrency is involved. This application is for educational and showcase purposes only. 
                Do not use real funds. This is running on Solana Devnet with test tokens only.
              </p>
            </div>
          </div>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent mb-2">
            🪙 Solana Coin Flip
          </h1>
          <p className="text-orange-400/80">Provably fair gaming on Solana Devnet</p>
        </div>

        {!account?.address ? (
          <Card className="max-w-md mx-auto shadow-xl border-orange-500/50 bg-black/50">
            <CardHeader>
              <CardTitle className="text-2xl text-center text-orange-500">
                Sign In
              </CardTitle>
              <CardDescription className="text-center text-orange-400/70">
                Enter your email to receive a verification code
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!otpSent ? (
                <form onSubmit={sendOtp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-orange-400/90">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="bg-black/50 border-orange-500/50 text-orange-300 focus:border-orange-500"
                    />
                  </div>
                  {authError && (
                    <div className="p-3 rounded-md bg-red-900/20 border border-red-500/50 text-red-400 text-sm">
                      {authError}
                    </div>
                  )}
                  <Button type="submit" className="w-full bg-orange-500 hover:bg-orange-600 text-black font-bold" disabled={authLoading}>
                    {authLoading ? 'Sending...' : 'Send Verification Code'}
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-orange-400/90">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      disabled
                      className="bg-black/50 border-orange-500/50 text-orange-300"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="code" className="text-orange-400/90">Verification Code</Label>
                    <Input
                      id="code"
                      type="text"
                      placeholder="Enter 6-digit code"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      required
                      maxLength={6}
                      className="bg-black/50 border-orange-500/50 text-orange-300 focus:border-orange-500"
                    />
                  </div>
                  {authError && (
                    <div className="p-3 rounded-md bg-red-900/20 border border-red-500/50 text-red-400 text-sm">
                      {authError}
                    </div>
                  )}
                  <Button type="submit" className="w-full bg-orange-500 hover:bg-orange-600 text-black font-bold" disabled={authLoading}>
                    {authLoading ? 'Connecting...' : 'Sign In'}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full text-orange-400 hover:text-orange-500 hover:bg-orange-500/10"
                    onClick={() => {
                      setOtpSent(false)
                      setVerificationCode('')
                      setAuthError('')
                    }}
                  >
                    Use Different Email
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* User Info - Solana Wallet */}
            <Card className="shadow-lg border-orange-500/30 bg-black/50">
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    <div>
                      <p className="text-sm text-orange-400/70 mb-2">Solana Wallet</p>
                      <p className="text-xs font-mono break-all bg-black/50 border border-orange-500/30 p-2 rounded text-orange-300">
                        {walletAddress || 'Creating...'}
                      </p>
                    </div>
                    <div className="flex items-end gap-4">
                      <div>
                        <p className="text-sm text-orange-400/70 mb-1">Balance</p>
                        <p className="text-2xl font-bold text-orange-500 flex items-center gap-2">
                          <Coins className="h-6 w-6" />
                          {parseFloat(balance).toFixed(4)} SOL
                        </p>
                      </div>
                      <Button variant="outline" size="icon" onClick={refreshBalance} className="border-orange-500/50 hover:bg-orange-500/10">
                        <RefreshCw className="h-4 w-4 text-orange-500" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <Button variant="outline" onClick={handleDisconnect} className="border-orange-500/50 text-orange-500 hover:bg-orange-500/10 w-full md:w-auto">
                      <LogOut className="h-4 w-4 mr-2" />
                      Disconnect
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Game Section */}
            <Card className="shadow-xl border-2 border-orange-500/50 bg-black/50">
              <CardHeader>
                <CardTitle className="text-3xl text-center text-orange-500">Place Your Bet</CardTitle>
                <CardDescription className="text-center text-orange-400/70">
                  Choose heads or tails and enter your stake amount
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Choice Buttons */}
                <div className="grid grid-cols-2 gap-4">
                  <Button
                    variant={choice === 'heads' ? 'default' : 'outline'}
                    size="lg"
                    className={`h-24 text-xl font-bold transition-all ${
                      choice === 'heads' 
                        ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-black shadow-lg shadow-orange-500/50 scale-105 border-orange-500' 
                        : 'border-orange-500/50 text-orange-500 hover:bg-orange-500/10 hover:scale-105'
                    }`}
                    onClick={() => setChoice('heads')}
                    disabled={processing}
                  >
                    🪙 Heads
                  </Button>
                  <Button
                    variant={choice === 'tails' ? 'default' : 'outline'}
                    size="lg"
                    className={`h-24 text-xl font-bold transition-all ${
                      choice === 'tails' 
                        ? 'bg-gradient-to-r from-orange-600 to-orange-700 text-black shadow-lg shadow-orange-600/50 scale-105 border-orange-600' 
                        : 'border-orange-600/50 text-orange-600 hover:bg-orange-600/10 hover:scale-105'
                    }`}
                    onClick={() => setChoice('tails')}
                    disabled={processing}
                  >
                    🪙 Tails
                  </Button>
                </div>

                {/* Stake Input */}
                <div className="space-y-2">
                  <Label htmlFor="stake" className="text-lg text-orange-400/90">Stake Amount (SOL)</Label>
                  <div className="flex gap-2 mb-2">
                    <Button
                      type="button"
                      variant={stake === '0.1' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setStake('0.1')}
                      disabled={processing}
                      className={stake === '0.1' 
                        ? 'bg-orange-500 text-black hover:bg-orange-600 border-orange-500' 
                        : 'border-orange-500/50 text-orange-500 hover:bg-orange-500/10'
                      }
                    >
                      0.1 SOL
                    </Button>
                    <Button
                      type="button"
                      variant={stake === '0.5' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setStake('0.5')}
                      disabled={processing}
                      className={stake === '0.5' 
                        ? 'bg-orange-500 text-black hover:bg-orange-600 border-orange-500' 
                        : 'border-orange-500/50 text-orange-500 hover:bg-orange-500/10'
                      }
                    >
                      0.5 SOL
                    </Button>
                    <Button
                      type="button"
                      variant={stake === '1' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setStake('1')}
                      disabled={processing}
                      className={stake === '1' 
                        ? 'bg-orange-500 text-black hover:bg-orange-600 border-orange-500' 
                        : 'border-orange-500/50 text-orange-500 hover:bg-orange-500/10'
                      }
                    >
                      1 SOL
                    </Button>
                  </div>
                  <Input
                    id="stake"
                    type="number"
                    value={stake}
                    onChange={(e) => setStake(e.target.value)}
                    min="0.01"
                    step="0.01"
                    disabled={processing}
                    className="text-lg h-12 bg-black/50 border-orange-500/50 text-orange-300 focus:border-orange-500"
                  />
                </div>

                {/* Coin Flip Animation - Show during processing or when result is available */}
                {(processing || coinResult) && (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div style={{ 
                      perspective: '1000px', 
                      perspectiveOrigin: '50% 50%',
                      width: '200px', 
                      height: '200px',
                      position: 'relative',
                    }}>
                      <div 
                        className={processing ? "coin-flip-animation" : ""}
                        style={{ 
                          width: '200px', 
                          height: '200px',
                          position: 'relative',
                          transformStyle: 'preserve-3d',
                          transformOrigin: 'center center',
                          transform: coinResult === 'heads' ? 'rotateY(0deg)' : coinResult === 'tails' ? 'rotateY(180deg)' : undefined,
                        }}
                      >
                        {/* Heads side */}
                        <div 
                          className="absolute rounded-full bg-gradient-to-br from-orange-400 via-orange-500 to-orange-600 flex flex-col items-center justify-center"
                          style={{ 
                            backfaceVisibility: 'hidden',
                            WebkitBackfaceVisibility: 'hidden',
                            transform: 'rotateY(0deg) translateZ(1px)',
                            width: '200px',
                            height: '200px',
                            top: 0,
                            left: 0,
                            border: '8px solid',
                            borderColor: '#f97316',
                            boxShadow: 'inset 0 0 20px rgba(0,0,0,0.3), 0 0 0 4px rgba(249,115,22,0.5), 0 4px 20px rgba(0,0,0,0.4)',
                          }}
                        >
                          {/* Coin edge effect */}
                          <div className="absolute inset-0 rounded-full border-4 border-orange-300/40" style={{ boxShadow: 'inset 0 2px 10px rgba(255,255,255,0.2), inset 0 -2px 10px rgba(0,0,0,0.3)' }}></div>
                          
                          <div className="relative z-10 flex flex-col items-center justify-center">
                            <img 
                              src={solLogo.src}
                              alt="Solana" 
                              className="w-16 h-16 mb-1 opacity-90"
                            />
                            <div className="text-xl font-extrabold text-black tracking-wider drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] uppercase mb-1">
                              HEADS
                            </div>
                            <div className="text-sm font-bold text-black/80 drop-shadow-[0_1px_2px_rgba(255,255,255,0.5)]">
                              {stake} SOL
                            </div>
                          </div>
                        </div>
                        {/* Tails side */}
                        <div 
                          className="absolute rounded-full bg-gradient-to-br from-orange-600 via-orange-500 to-orange-400 flex flex-col items-center justify-center"
                          style={{ 
                            backfaceVisibility: 'hidden',
                            WebkitBackfaceVisibility: 'hidden',
                            transform: 'rotateY(180deg) translateZ(-1px)',
                            width: '200px',
                            height: '200px',
                            top: 0,
                            left: 0,
                            border: '8px solid',
                            borderColor: '#f97316',
                            boxShadow: 'inset 0 0 20px rgba(0,0,0,0.3), 0 0 0 4px rgba(249,115,22,0.5), 0 4px 20px rgba(0,0,0,0.4)',
                          }}
                        >
                          {/* Coin edge effect */}
                          <div className="absolute inset-0 rounded-full border-4 border-orange-300/40" style={{ boxShadow: 'inset 0 2px 10px rgba(255,255,255,0.2), inset 0 -2px 10px rgba(0,0,0,0.3)' }}></div>
                          
                          <div className="relative z-10 flex flex-col items-center justify-center">
                            <img 
                              src={solLogo.src}
                              alt="Solana" 
                              className="w-16 h-16 mb-1 opacity-90"
                            />
                            <div className="text-xl font-extrabold text-black tracking-wider drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] uppercase mb-1">
                              TAILS
                            </div>
                            <div className="text-sm font-bold text-black/80 drop-shadow-[0_1px_2px_rgba(255,255,255,0.5)]">
                              {stake} SOL
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    {processing && (
                      <>
                        <p className="mt-8 text-2xl font-bold text-orange-500 animate-pulse">
                          Flipping Coin...
                        </p>
                        <p className="mt-3 text-sm text-orange-400/70">
                          Processing transaction on Solana Devnet
                        </p>
                        <div className="mt-4 flex gap-2">
                          <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                          <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Flip Button */}
                {!processing && (
                  <Button
                    onClick={handleFlip}
                    disabled={!choice || !walletAddress}
                    className="w-full h-14 text-lg font-bold bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-black shadow-lg shadow-orange-500/50 border-orange-500"
                    size="lg"
                  >
                    {coinResult ? '🎲 Play Again' : '🎲 Flip Coin'}
                  </Button>
                )}

                {/* Error Message */}
                {authError && (
                  <div className="p-3 rounded-md bg-red-900/20 border border-red-500/50 text-red-400 text-sm text-center">
                    {authError}
                  </div>
                )}

                {/* Game Result */}
                {gameResult && (
                  <Card className={`border-2 ${
                    gameResult.won 
                      ? 'border-orange-500 bg-orange-500/10' 
                      : 'border-red-900 bg-red-900/20'
                  }`}>
                    <CardContent className="pt-6">
                      <div className="text-center space-y-4">
                        <div className="text-6xl">
                          {gameResult.won ? <Trophy className="h-16 w-16 mx-auto text-orange-500" /> : <XCircle className="h-16 w-16 mx-auto text-red-500" />}
                        </div>
                        <h3 className={`text-3xl font-bold ${
                          gameResult.won ? 'text-orange-500' : 'text-red-500'
                        }`}>
                          {gameResult.won ? '🎉 You Won!' : '😢 You Lost'}
                        </h3>
                        <div className="space-y-3 text-base">
                          <div className="bg-black/30 rounded-lg p-3 border border-orange-500/30">
                            <p className="text-orange-300 mb-1">
                              <span className="font-semibold text-orange-400">Your choice:</span>{' '}
                              <span className="text-xl font-bold text-orange-500 uppercase">{gameResult.choice}</span>
                            </p>
                            <p className="text-orange-300">
                              <span className="font-semibold text-orange-400">Result:</span>{' '}
                              <span className="text-xl font-bold text-orange-500 uppercase">{gameResult.result}</span>
                            </p>
                          </div>
                          <p className="text-xs font-mono text-orange-400/70 break-all">
                            Hash: {gameResult.slotHash}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
