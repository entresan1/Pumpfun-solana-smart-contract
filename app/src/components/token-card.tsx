"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Copy, Check, ExternalLink } from "lucide-react"
import { MOCK_TOKEN_INFO, MOCK_POOL_STATS, formatNumber, formatPrice } from "@/lib/mock-data"

export function TokenCard() {
  const [copied, setCopied] = useState(false)
  
  const copyCA = async () => {
    if (MOCK_TOKEN_INFO.ca) {
      await navigator.clipboard.writeText(MOCK_TOKEN_INFO.ca)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#2A3338] flex items-center justify-center">
              <span className="text-[#E9E1D8] font-semibold text-sm">PHB</span>
            </div>
            <div>
              <CardTitle className="text-lg">{MOCK_TOKEN_INFO.name}</CardTitle>
              <span className="text-sm text-[#5F6A6E]">${MOCK_TOKEN_INFO.symbol}</span>
            </div>
          </div>
          <Badge variant="secondary">LIVE</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* CA Section */}
        <div className="space-y-2">
          <label className="text-label">Contract Address (CA)</label>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-sm bg-[#0E1518] rounded-lg px-3 py-2.5 font-mono border border-[#2A3338] truncate">
              {MOCK_TOKEN_INFO.ca ? (
                <span className="text-[#9FA6A3]">{MOCK_TOKEN_INFO.ca}</span>
              ) : (
                <span className="text-[#5F6A6E] italic">Coming soon...</span>
              )}
            </code>
            <Button
              variant="ghost"
              size="icon"
              onClick={copyCA}
              disabled={!MOCK_TOKEN_INFO.ca}
              className="shrink-0 h-9 w-9"
            >
              {copied ? (
                <Check className="w-4 h-4 text-[#E9E1D8]" />
              ) : (
                <Copy className="w-4 h-4 text-[#5F6A6E]" />
              )}
            </Button>
            {MOCK_TOKEN_INFO.ca && (
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0 h-9 w-9"
                asChild
              >
                <a href={`https://solscan.io/token/${MOCK_TOKEN_INFO.ca}`} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4 text-[#5F6A6E]" />
                </a>
              </Button>
            )}
          </div>
        </div>

        <div className="divider-line" />

        {/* Price & Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-label">Price</label>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-medium text-[#E9E1D8] text-value">
                ${formatPrice(MOCK_POOL_STATS.price)}
              </span>
              <span className={`text-xs ${MOCK_POOL_STATS.priceChange24h < 0 ? 'text-[#8C3A32]' : 'text-[#9FA6A3]'}`}>
                {MOCK_POOL_STATS.priceChange24h > 0 ? '+' : ''}{MOCK_POOL_STATS.priceChange24h.toFixed(1)}%
              </span>
            </div>
          </div>
          
          <div className="space-y-1">
            <label className="text-label">Market Cap</label>
            <span className="text-xl font-medium text-[#E9E1D8] text-value block">
              ${formatNumber(MOCK_POOL_STATS.marketCap)}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 rounded-lg bg-[#0E1518] border border-[#2A3338] text-center">
            <span className="text-xs text-[#5F6A6E] block mb-1">24h Vol</span>
            <span className="text-sm text-[#E9E1D8] text-value">{formatNumber(MOCK_POOL_STATS.volume24h)} SOL</span>
          </div>
          <div className="p-3 rounded-lg bg-[#0E1518] border border-[#2A3338] text-center">
            <span className="text-xs text-[#5F6A6E] block mb-1">Holders</span>
            <span className="text-sm text-[#E9E1D8] text-value">{formatNumber(MOCK_POOL_STATS.holders, 0)}</span>
          </div>
          <div className="p-3 rounded-lg bg-[#0E1518] border border-[#2A3338] text-center">
            <span className="text-xs text-[#5F6A6E] block mb-1">24h Txns</span>
            <span className="text-sm text-[#E9E1D8] text-value">{formatNumber(MOCK_POOL_STATS.transactions24h, 0)}</span>
          </div>
        </div>

        {/* ATH */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-[#0E1518] border border-[#2A3338]">
          <div>
            <span className="text-xs text-[#5F6A6E] block">All-Time High</span>
            <span className="text-sm text-[#E9E1D8] text-value">${formatPrice(MOCK_POOL_STATS.allTimeHigh)}</span>
          </div>
          <span className="text-xs text-[#5F6A6E]">{MOCK_POOL_STATS.athDate}</span>
        </div>
      </CardContent>
    </Card>
  )
}

