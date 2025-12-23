"use client"

import { useState, use } from "react"
import { TradePanel } from "@/components/trade-panel"
import { PositionCard } from "@/components/position-card"
import { TreasuryCard } from "@/components/treasury-card"
import { TokenCard } from "@/components/token-card"
import { TradesTable } from "@/components/trades-table"
import { TooltipProvider } from "@/components/ui/tooltip"
import { PublicKey } from "@solana/web3.js"
import Link from "next/link"

export default function TokenPage({ params }: { params: Promise<{ mint: string }> }) {
    const { mint: mintStr } = use(params)
    const [refreshKey, setRefreshKey] = useState(0)

    let mint: PublicKey
    try {
        mint = new PublicKey(mintStr)
    } catch (e) {
        return (
            <div className="min-h-screen bg-[#0E1518] flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl text-[#E9E1D8] mb-4">Invalid Token Address</h1>
                    <Link href="/" className="text-[#8C3A32] hover:underline">Back to Explore</Link>
                </div>
            </div>
        )
    }

    const handleTradeComplete = () => {
        setRefreshKey(prev => prev + 1)
    }

    return (
        <TooltipProvider>
            <div className="min-h-screen bg-[#0E1518]">
                <div className="max-w-6xl mx-auto px-6 py-12">

                    <div className="mb-8">
                        <Link href="/" className="text-sm text-[#9FA6A3] hover:text-[#E9E1D8] transition-colors">
                            ← Back to Explore
                        </Link>
                    </div>

                    {/* Main content grid - 2 columns with equal height */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">

                        {/* Left column - Token Info & Trade */}
                        <div className="flex flex-col gap-6 h-full">
                            <TokenCard mint={mint} />
                            <TradePanel
                                mint={mint}
                                onTradeComplete={handleTradeComplete}
                                className="flex-1"
                            />
                        </div>

                        {/* Right column - Position & Treasury */}
                        <div className="flex flex-col gap-6 h-full">
                            <PositionCard key={`position-${refreshKey}`} mint={mint} className="flex-1" />
                            <TreasuryCard />
                        </div>
                    </div>

                    {/* Trades Section - Full width below columns */}
                    <div className="mt-8">
                        <TradesTable key={`trades-${refreshKey}`} mint={mint} />
                    </div>
                </div>
            </div>
        </TooltipProvider>
    )
}
