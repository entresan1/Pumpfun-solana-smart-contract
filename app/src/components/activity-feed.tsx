"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MOCK_RECENT_TRADES, formatNumber } from "@/lib/mock-data"

export function ActivityFeed() {
  const [trades, setTrades] = useState(MOCK_RECENT_TRADES)
  
  // Simulate new trades coming in
  useEffect(() => {
    const interval = setInterval(() => {
      const types = ["buy", "sell"] as const
      const type = types[Math.floor(Math.random() * types.length)]
      const isSell = type === "sell"
      const taxed = isSell && Math.random() > 0.4 // 60% of sells are taxed
      
      const newTrade = {
        type,
        amount: Math.floor(Math.random() * 2000000) + 50000,
        sol: Math.random() * 0.05 + 0.001,
        taxed,
        time: "just now",
        wallet: generateRandomWallet(),
      }
      
      setTrades(prev => [newTrade, ...prev.slice(0, 7)])
    }, 8000 + Math.random() * 12000) // Random interval 8-20 seconds
    
    return () => clearInterval(interval)
  }, [])

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Live Activity</CardTitle>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#9FA6A3] animate-pulse" />
            <span className="text-xs text-[#5F6A6E]">Live</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {trades.map((trade, i) => (
            <div 
              key={i} 
              className={`flex items-center justify-between p-3 rounded-lg border transition-all duration-300 ${
                trade.taxed 
                  ? 'bg-[#0E1518] border-l-2 border-[#8C3A32] border-t-[#2A3338] border-r-[#2A3338] border-b-[#2A3338]' 
                  : 'bg-[#0E1518] border-[#2A3338]'
              } ${i === 0 ? 'animate-fadeIn' : ''}`}
            >
              <div className="flex items-center gap-3">
                <Badge 
                  variant={trade.type === "buy" ? "secondary" : trade.taxed ? "penalty" : "secondary"}
                  className="w-12 justify-center text-xs"
                >
                  {trade.type.toUpperCase()}
                </Badge>
                <div>
                  <span className="text-sm text-[#E9E1D8] text-value">
                    {formatNumber(trade.amount, 0)}
                  </span>
                  <span className="text-xs text-[#5F6A6E] ml-1">PHB</span>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <span className="text-sm text-[#E9E1D8] text-value">{trade.sol.toFixed(4)}</span>
                  <span className="text-xs text-[#5F6A6E] ml-1">SOL</span>
                </div>
                {trade.taxed && (
                  <Badge variant="penalty" className="text-xs">
                    TAXED
                  </Badge>
                )}
                <div className="w-20 text-right">
                  <span className="text-xs text-[#5F6A6E]">{trade.time}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function generateRandomWallet(): string {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  const start = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("")
  const end = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("")
  return `${start}...${end}`
}

