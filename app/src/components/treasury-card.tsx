"use client"

import { useState, useEffect, useCallback } from "react"
import { useConnection } from "@solana/wallet-adapter-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Copy, Check } from "lucide-react"
import { formatLamportsToSol, formatPercentage, shortenPubkey } from "@/lib/format"
import { getCurveConfigPDA } from "@/lib/pdas"
import { fetchCurveConfig, CurveConfiguration } from "@/lib/solana"
import { PROGRAM_ID, TREASURY_WALLET, DEFAULT_PAPERHAND_TAX_BPS } from "@/lib/constants"

export function TreasuryCard() {
  const { connection } = useConnection()
  
  const [config, setConfig] = useState<CurveConfiguration | null>(null)
  const [treasuryBalance, setTreasuryBalance] = useState(0)
  const [copied, setCopied] = useState<'treasury' | 'program' | null>(null)
  const [isLoading, setIsLoading] = useState(true)

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
      // Silent fail
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
      <CardHeader>
        <CardTitle>Protocol</CardTitle>
        <CardDescription>Treasury & configuration</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {isLoading ? (
          <div className="space-y-3">
            <div className="h-4 bg-[#2A3338] rounded w-3/4 animate-pulse"></div>
            <div className="h-4 bg-[#2A3338] rounded w-1/2 animate-pulse"></div>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Treasury Wallet */}
            <div className="space-y-2">
              <label className="text-label">Treasury Wallet</label>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-sm text-[#9FA6A3] bg-[#0E1518] rounded-lg px-3 py-2 font-mono border border-[#2A3338]">
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
              </div>
            </div>

            {/* Treasury Balance */}
            <div className="flex justify-between items-center p-4 rounded-lg bg-[#0E1518] border border-[#2A3338]">
              <span className="text-[#9FA6A3] text-sm">Balance</span>
              <span className="text-[#E9E1D8] font-medium text-lg text-value">
                {formatLamportsToSol(treasuryBalance)} SOL
              </span>
            </div>

            {/* Tax Rate */}
            <div className="flex justify-between items-center">
              <span className="text-label">Penalty Rate</span>
              <span className="text-[#E9E1D8] text-value">{formatPercentage(taxRate)}</span>
            </div>

            <div className="divider-line my-2" />

            {/* Program ID */}
            <div className="space-y-2">
              <label className="text-label">Program</label>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-sm text-[#9FA6A3] bg-[#0E1518] rounded-lg px-3 py-2 font-mono border border-[#2A3338]">
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
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
