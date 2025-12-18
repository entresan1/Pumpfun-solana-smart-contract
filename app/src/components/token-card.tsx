"use client"

import { useState, useEffect, useCallback } from "react"
import { useConnection } from "@solana/wallet-adapter-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Copy, Check, ExternalLink, RefreshCw } from "lucide-react"
import { TOKEN_MINT } from "@/lib/constants"

// Token info - update CA when ready
const TOKEN_INFO = {
  name: "Paper Hand Bitch",
  symbol: "PHB",
  decimals: 6,
  ca: "", // Contract Address - leave empty until launch
}

export function TokenCard() {
  const { connection } = useConnection()
  const [copied, setCopied] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [tokenSupply, setTokenSupply] = useState<number | null>(null)
  
  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      // Try to get token supply from mint
      const mintInfo = await connection.getParsedAccountInfo(TOKEN_MINT)
      if (mintInfo.value && 'parsed' in mintInfo.value.data) {
        const supply = mintInfo.value.data.parsed.info.supply
        const decimals = mintInfo.value.data.parsed.info.decimals
        setTokenSupply(Number(supply) / Math.pow(10, decimals))
      }
    } catch {
      // Token might not exist yet
    } finally {
      setIsLoading(false)
    }
  }, [connection])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const copyCA = async () => {
    if (TOKEN_INFO.ca) {
      await navigator.clipboard.writeText(TOKEN_INFO.ca)
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
              <CardTitle className="text-lg">{TOKEN_INFO.name}</CardTitle>
              <span className="text-sm text-[#5F6A6E]">${TOKEN_INFO.symbol}</span>
            </div>
          </div>
          <Badge variant="secondary">MAINNET</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* CA Section */}
        <div className="space-y-2">
          <label className="text-label">Contract Address (CA)</label>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-sm bg-[#0E1518] rounded-lg px-3 py-2.5 font-mono border border-[#2A3338] truncate">
              {TOKEN_INFO.ca ? (
                <span className="text-[#9FA6A3]">{TOKEN_INFO.ca}</span>
              ) : (
                <span className="text-[#5F6A6E] italic">Coming soon...</span>
              )}
            </code>
            <Button
              variant="ghost"
              size="icon"
              onClick={copyCA}
              disabled={!TOKEN_INFO.ca}
              className="shrink-0 h-9 w-9"
            >
              {copied ? (
                <Check className="w-4 h-4 text-[#E9E1D8]" />
              ) : (
                <Copy className="w-4 h-4 text-[#5F6A6E]" />
              )}
            </Button>
            {TOKEN_INFO.ca && (
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0 h-9 w-9"
                asChild
              >
                <a href={`https://solscan.io/token/${TOKEN_INFO.ca}`} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4 text-[#5F6A6E]" />
                </a>
              </Button>
            )}
          </div>
        </div>

        <div className="divider-line" />

        {/* Stats - Real data only */}
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-5 h-5 text-[#5F6A6E] animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-lg bg-[#0E1518] border border-[#2A3338]">
                <span className="text-xs text-[#5F6A6E] block mb-1">Total Supply</span>
                <span className="text-sm text-[#E9E1D8] text-value">
                  {tokenSupply ? `${(tokenSupply / 1_000_000).toFixed(0)}M` : "--"}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-[#0E1518] border border-[#2A3338]">
                <span className="text-xs text-[#5F6A6E] block mb-1">Decimals</span>
                <span className="text-sm text-[#E9E1D8] text-value">{TOKEN_INFO.decimals}</span>
              </div>
            </div>
            
            <p className="text-xs text-[#5F6A6E] text-center">
              Price data available after CA launch
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
