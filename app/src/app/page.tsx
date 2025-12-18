"use client"

import { useState } from "react"
import { TradePanel } from "@/components/trade-panel"
import { PositionCard } from "@/components/position-card"
import { TreasuryCard } from "@/components/treasury-card"
import { TooltipProvider } from "@/components/ui/tooltip"
import { TOKEN_MINT } from "@/lib/constants"

export default function Home() {
  const [refreshKey, setRefreshKey] = useState(0)
  
  const handleTradeComplete = () => {
    setRefreshKey(prev => prev + 1)
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-[#0E1518]">
        <div className="max-w-6xl mx-auto px-6 py-12">
          
          {/* Header section */}
          <div className="mb-16">
            <div className="flex items-center gap-4 mb-6">
              {/* Geometric marker */}
              <div className="w-1 h-12 bg-[#2A3338]" />
              <div>
                <h1 className="text-3xl font-medium text-[#E9E1D8] tracking-tight">
                  PaperHandTax
                </h1>
                <p className="text-[#9FA6A3] mt-1">
                  Sell at a loss. Receive 50% less.
                </p>
              </div>
            </div>
            
            {/* Rule statement */}
            <div className="flex items-start gap-6 pl-5 border-l border-[#2A3338]">
              <div className="space-y-3 max-w-xl">
                <p className="text-sm text-[#9FA6A3] leading-relaxed">
                  When you sell below your cost basis, 50% of proceeds are routed to the protocol treasury. 
                  Cost basis is tracked per-wallet using weighted average of platform purchases only.
                </p>
                <div className="flex items-center gap-6 text-xs text-[#5F6A6E]">
                  <span>Loss = SOL out &lt; Cost basis</span>
                  <span className="w-px h-3 bg-[#2A3338]" />
                  <span>Penalty = 50% of proceeds</span>
                </div>
              </div>
            </div>
          </div>

          {/* Main content grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Left column - Trade */}
            <div>
              <TradePanel mint={TOKEN_MINT} onTradeComplete={handleTradeComplete} />
            </div>

            {/* Right column - Position & Protocol */}
            <div className="space-y-6">
              <PositionCard key={`position-${refreshKey}`} mint={TOKEN_MINT} />
              <TreasuryCard />
            </div>
          </div>

          {/* Footer */}
          <footer className="mt-24 pt-8 border-t border-[#2A3338]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6 text-xs text-[#5F6A6E]">
                <span>PaperHandTax Protocol</span>
                <span className="w-px h-3 bg-[#2A3338]" />
                <span>Mainnet</span>
              </div>
              <p className="text-xs text-[#5F6A6E]">
                Not financial advice.
              </p>
            </div>
          </footer>
        </div>
      </div>
    </TooltipProvider>
  )
}
