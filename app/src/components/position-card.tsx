"use client"

import { useState, useEffect, useCallback } from "react"
import { useConnection, useWallet } from "@solana/wallet-adapter-react"
import { PublicKey } from "@solana/web3.js"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
import { formatLamportsToSol, formatTokenAmount } from "@/lib/format"
import { getPoolPDA, getUserPositionPDA } from "@/lib/pdas"
import { fetchPool, fetchUserPosition, LiquidityPool, UserPosition } from "@/lib/solana"

interface PositionCardProps {
  mint: PublicKey | null
}

export function PositionCard({ mint }: PositionCardProps) {
  const { connection } = useConnection()
  const { publicKey, connected } = useWallet()
  
  const [position, setPosition] = useState<UserPosition | null>(null)
  const [pool, setPool] = useState<LiquidityPool | null>(null)
  const [currentValue, setCurrentValue] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  const fetchData = useCallback(async () => {
    if (!mint || !publicKey) {
      setPosition(null)
      setPool(null)
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    try {
      const [poolPDA] = getPoolPDA(mint)
      const [positionPDA] = getUserPositionPDA(poolPDA, publicKey)
      
      const [poolData, positionData] = await Promise.all([
        fetchPool(connection, poolPDA),
        fetchUserPosition(connection, positionPDA)
      ])
      
      setPool(poolData)
      setPosition(positionData)
      
      if (positionData && poolData && positionData.totalTokens.toNumber() > 0) {
        const tokenAmount = positionData.totalTokens.toNumber()
        const solReserve = poolData.reserveTwo.toNumber()
        const tokenReserve = poolData.reserveOne.toNumber()
        const value = tokenReserve > 0 ? (solReserve * tokenAmount) / (tokenReserve + tokenAmount) : 0
        setCurrentValue(value)
      } else {
        setCurrentValue(0)
      }
    } catch {
      // Silent fail
    } finally {
      setIsLoading(false)
    }
  }, [connection, mint, publicKey])

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 15000)
    return () => clearInterval(interval)
  }, [fetchData])

  const totalTokens = position?.totalTokens.toNumber() || 0
  const totalSol = position?.totalSol.toNumber() || 0
  const avgCost = totalTokens > 0 ? totalSol / totalTokens : 0
  const avgCostPerToken = avgCost * 1_000_000
  const pnl = currentValue - totalSol
  const pnlPercent = totalSol > 0 ? (pnl / totalSol) * 100 : 0
  const isProfit = pnl >= 0

  if (!connected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Position</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-[#5F6A6E] text-center py-8 text-sm">Connect wallet to view</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <TooltipProvider>
      <Card>
        <CardHeader>
          <CardTitle>Position</CardTitle>
          <CardDescription>On-curve cost basis</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {isLoading ? (
            <div className="space-y-3">
              <div className="h-4 bg-[#2A3338] rounded w-3/4 animate-pulse"></div>
              <div className="h-4 bg-[#2A3338] rounded w-1/2 animate-pulse"></div>
            </div>
          ) : !position || totalTokens === 0 ? (
            <div className="text-center py-6 space-y-2">
              <p className="text-[#5F6A6E] text-sm">No position</p>
              <p className="text-xs text-[#5F6A6E]">Buy tokens to establish position</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-label">Tokens</span>
                <span className="text-[#E9E1D8] text-value">{formatTokenAmount(totalTokens)}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-label">SOL Spent</span>
                <span className="text-[#E9E1D8] text-value">{formatLamportsToSol(totalSol)} SOL</span>
              </div>

              <div className="flex justify-between items-center">
                <Tooltip>
                  <TooltipTrigger className="text-label cursor-help">Avg Cost</TooltipTrigger>
                  <TooltipContent>
                    <p>Weighted average cost per token</p>
                  </TooltipContent>
                </Tooltip>
                <span className="text-[#E9E1D8] text-value text-sm">{formatLamportsToSol(avgCostPerToken, 8)} SOL</span>
              </div>

              <div className="divider-line my-4" />

              <div className="flex justify-between items-center">
                <span className="text-label">Current Value</span>
                <span className="text-[#E9E1D8] text-value">{formatLamportsToSol(currentValue)} SOL</span>
              </div>

              <div className={`flex justify-between items-center p-3 rounded-lg ${isProfit ? 'bg-[#0E1518]' : 'bg-[#0E1518] border-l-2 border-[#8C3A32]'}`}>
                <span className="text-label">Unrealized P&L</span>
                <span className={`text-value font-medium ${isProfit ? 'text-[#E9E1D8]' : 'text-[#8C3A32]'}`}>
                  {isProfit ? '+' : ''}{formatLamportsToSol(pnl)} SOL
                  <span className="text-xs ml-1 text-[#9FA6A3]">({pnlPercent.toFixed(1)}%)</span>
                </span>
              </div>

              <div className="flex justify-center pt-2">
                <Badge variant={isProfit ? "secondary" : "penalty"}>
                  {isProfit ? "No penalty on sell" : "50% penalty on sell"}
                </Badge>
              </div>
            </div>
          )}

          <p className="text-xs text-[#5F6A6E] text-center pt-2">
            Only platform trades tracked
          </p>
        </CardContent>
      </Card>
    </TooltipProvider>
  )
}
