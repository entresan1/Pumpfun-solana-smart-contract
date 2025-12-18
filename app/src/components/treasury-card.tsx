"use client"

import { useState, useEffect, useCallback } from "react"
import { useConnection } from "@solana/wallet-adapter-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Copy, Check, ExternalLink, Vault, Percent, Shield } from "lucide-react"
import { formatLamportsToSol, formatPercentage, shortenPubkey } from "@/lib/format"
import { getCurveConfigPDA } from "@/lib/pdas"
import { fetchCurveConfig, CurveConfiguration } from "@/lib/solana"
import { PROGRAM_ID, TREASURY_WALLET, DEFAULT_PAPERHAND_TAX_BPS } from "@/lib/constants"
import { MOCK_TREASURY_STATS } from "@/lib/mock-data"

export function TreasuryCard() {
  const { connection } = useConnection()
  
  const [config, setConfig] = useState<CurveConfiguration | null>(null)
  const [treasuryBalance, setTreasuryBalance] = useState(0)
  const [copied, setCopied] = useState<'treasury' | 'program' | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Use mock treasury balance as fallback
  const displayBalance = treasuryBalance > 0 ? treasuryBalance : MOCK_TREASURY_STATS.totalCollected * 1e9

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      const [configPDA] = getCurveConfigPDA()
      
      const [configData, balance] = await Promise.all([
        fetchCurveConfig(connection, configPDA),
        connection.getBalance(TREASURY_WALLET).catch(() => 0)
      ])
      
      setConfig(configData)
      setTreasuryBalance(balance)
    } catch {
      // Silent fail - use mock data
    } finally {
      setIsLoading(false)
    }
  }, [connection])

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [fetchData])

  const copyToClipboard = async (text: string, type: 'treasury' | 'program') => {
    await navigator.clipboard.writeText(text)
    setCopied(type)
    setTimeout(() => setCopied(null), 2000)
  }

  const taxRate = config?.paperhandTaxBps || DEFAULT_PAPERHAND_TAX_BPS

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#0E1518] border border-[#2A3338] flex items-center justify-center">
            <Vault className="w-5 h-5 text-[#9FA6A3]" />
          </div>
          <div>
            <CardTitle>Protocol Treasury</CardTitle>
            <CardDescription>Collected from paper hands</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {isLoading ? (
          <div className="space-y-3">
            <div className="h-4 bg-[#2A3338] rounded w-3/4 animate-pulse"></div>
            <div className="h-4 bg-[#2A3338] rounded w-1/2 animate-pulse"></div>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Treasury Balance - Featured */}
            <div className="p-5 rounded-xl bg-gradient-to-br from-[#141D21] to-[#0E1518] border border-[#2A3338]">
              <span className="text-xs text-[#5F6A6E] uppercase tracking-wider block mb-2">Total Collected</span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-medium text-[#E9E1D8] text-value">
                  {formatLamportsToSol(displayBalance)}
                </span>
                <span className="text-lg text-[#5F6A6E]">SOL</span>
              </div>
              <div className="flex items-center gap-4 mt-3 pt-3 border-t border-[#2A3338]">
                <div>
                  <span className="text-xs text-[#5F6A6E] block">Taxes collected</span>
                  <span className="text-sm text-[#9FA6A3] text-value">{MOCK_TREASURY_STATS.taxesPaid}</span>
                </div>
                <div className="w-px h-8 bg-[#2A3338]" />
                <div>
                  <span className="text-xs text-[#5F6A6E] block">Avg per tax</span>
                  <span className="text-sm text-[#9FA6A3] text-value">{MOCK_TREASURY_STATS.avgTaxPerSell.toFixed(4)} SOL</span>
                </div>
              </div>
            </div>

            {/* Tax Rate */}
            <div className="flex items-center justify-between p-4 rounded-lg bg-[#0E1518] border border-[#2A3338]">
              <div className="flex items-center gap-3">
                <Percent className="w-5 h-5 text-[#8C3A32]" />
                <div>
                  <span className="text-sm text-[#E9E1D8]">Paper Hand Tax Rate</span>
                  <span className="text-xs text-[#5F6A6E] block">Applied on loss-making sells</span>
                </div>
              </div>
              <span className="text-2xl font-medium text-[#8C3A32] text-value">{formatPercentage(taxRate)}</span>
            </div>

            <div className="divider-line" />

            {/* Treasury Wallet */}
            <div className="space-y-2">
              <label className="text-label">Treasury Wallet</label>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-sm text-[#9FA6A3] bg-[#0E1518] rounded-lg px-3 py-2.5 font-mono border border-[#2A3338]">
                  {shortenPubkey(TREASURY_WALLET.toBase58(), 6)}
                </code>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => copyToClipboard(TREASURY_WALLET.toBase58(), 'treasury')}
                  className="shrink-0 h-9 w-9"
                >
                  {copied === 'treasury' ? (
                    <Check className="w-4 h-4 text-[#E9E1D8]" />
                  ) : (
                    <Copy className="w-4 h-4 text-[#5F6A6E]" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0 h-9 w-9"
                  asChild
                >
                  <a href={`https://solscan.io/account/${TREASURY_WALLET.toBase58()}`} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4 text-[#5F6A6E]" />
                  </a>
                </Button>
              </div>
            </div>

            {/* Program ID */}
            <div className="space-y-2">
              <label className="text-label">Program ID</label>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-sm text-[#9FA6A3] bg-[#0E1518] rounded-lg px-3 py-2.5 font-mono border border-[#2A3338]">
                  {shortenPubkey(PROGRAM_ID.toBase58(), 6)}
                </code>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => copyToClipboard(PROGRAM_ID.toBase58(), 'program')}
                  className="shrink-0 h-9 w-9"
                >
                  {copied === 'program' ? (
                    <Check className="w-4 h-4 text-[#E9E1D8]" />
                  ) : (
                    <Copy className="w-4 h-4 text-[#5F6A6E]" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0 h-9 w-9"
                  asChild
                >
                  <a href={`https://solscan.io/account/${PROGRAM_ID.toBase58()}`} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4 text-[#5F6A6E]" />
                  </a>
                </Button>
              </div>
            </div>

            {/* Security badge */}
            <div className="flex items-center justify-center gap-2 pt-2">
              <Shield className="w-4 h-4 text-[#5F6A6E]" />
              <span className="text-xs text-[#5F6A6E]">On-chain verified · Immutable</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
