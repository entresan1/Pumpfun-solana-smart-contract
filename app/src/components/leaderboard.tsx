"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MOCK_TOP_PAPERHAND, MOCK_TREASURY_STATS } from "@/lib/mock-data"
import { Trophy, Skull, TrendingDown } from "lucide-react"

export function Leaderboard() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <Skull className="w-5 h-5 text-[#8C3A32]" />
          <div>
            <CardTitle className="text-base">Hall of Paper Hands</CardTitle>
            <CardDescription>Top penalty payers</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats summary */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-[#0E1518] border border-[#2A3338]">
            <span className="text-xs text-[#5F6A6E] block mb-1">Total Collected</span>
            <span className="text-lg font-medium text-[#E9E1D8] text-value">
              {MOCK_TREASURY_STATS.totalCollected.toFixed(2)} SOL
            </span>
          </div>
          <div className="p-3 rounded-lg bg-[#0E1518] border border-[#2A3338]">
            <span className="text-xs text-[#5F6A6E] block mb-1">Taxes Paid</span>
            <span className="text-lg font-medium text-[#E9E1D8] text-value">
              {MOCK_TREASURY_STATS.taxesPaid}
            </span>
          </div>
        </div>

        <div className="divider-line" />

        {/* Leaderboard */}
        <div className="space-y-2">
          {MOCK_TOP_PAPERHAND.map((entry, i) => (
            <div 
              key={i}
              className={`flex items-center justify-between p-3 rounded-lg border ${
                i === 0 
                  ? 'bg-[#141D21] border-[#8C3A32]' 
                  : 'bg-[#0E1518] border-[#2A3338]'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded flex items-center justify-center text-xs font-medium ${
                  i === 0 ? 'bg-[#8C3A32] text-[#E9E1D8]' :
                  i === 1 ? 'bg-[#2A3338] text-[#E9E1D8]' :
                  i === 2 ? 'bg-[#2A3338] text-[#9FA6A3]' :
                  'bg-transparent text-[#5F6A6E]'
                }`}>
                  {i === 0 ? <Trophy className="w-3 h-3" /> : i + 1}
                </div>
                <code className="text-sm text-[#9FA6A3] font-mono">{entry.wallet}</code>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <span className="text-sm text-[#8C3A32] text-value font-medium">
                    {entry.taxPaid.toFixed(2)} SOL
                  </span>
                  <span className="text-xs text-[#5F6A6E] block">{entry.sells} sells</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-center gap-2 pt-2">
          <TrendingDown className="w-4 h-4 text-[#5F6A6E]" />
          <span className="text-xs text-[#5F6A6E]">Updated in real-time</span>
        </div>
      </CardContent>
    </Card>
  )
}

