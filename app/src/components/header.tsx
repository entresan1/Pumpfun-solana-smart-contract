"use client"

import Image from "next/image"
import { useWallet } from "@solana/wallet-adapter-react"
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui"
import logo from "@/app/logo.png"

export function Header() {
  const { connected } = useWallet()

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-[#2A3338] bg-[#0E1518]">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <Image 
              src={logo} 
              alt="Paper Hand Bitch Tax" 
              width={32} 
              height={32}
              className="rounded-lg"
            />
            <span className="font-medium text-[#E9E1D8] tracking-tight">
              Paper Hand Bitch Tax
            </span>
          </div>

          {/* Wallet */}
          <div className="wallet-adapter-button-wrapper">
            <WalletMultiButton 
              style={{
                background: connected ? '#E9E1D8' : '#141D21',
                color: connected ? '#0E1518' : '#E9E1D8',
                borderRadius: '12px',
                height: '40px',
                fontSize: '14px',
                fontWeight: '500',
                border: connected ? 'none' : '1px solid #2A3338',
              }}
            />
          </div>
        </div>
      </div>
    </header>
  )
}
