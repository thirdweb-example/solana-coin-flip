import type { Metadata } from 'next'
import './globals.css'
import { ThirdwebProvider } from 'thirdweb/react'
import { client } from '@/lib/thirdweb-client'

export const metadata: Metadata = {
  title: 'Solana Coin Flip Game',
  description: 'A simple coin flip game on Solana Devnet',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <ThirdwebProvider>
          {children}
        </ThirdwebProvider>
      </body>
    </html>
  )
}

