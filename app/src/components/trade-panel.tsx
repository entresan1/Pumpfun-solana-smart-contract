"use client"

import { useState, useEffect, useCallback } from "react"
import { useConnection, useWallet } from "@solana/wallet-adapter-react"
import { PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { TooltipProvider } from "@/components/ui/tooltip"
import { formatLamportsToSol, formatTokenAmount, calculateCostBasisForSale, isLoss, calculateTax } from "@/lib/format"
import { getPoolPDA, getUserPositionPDA, getCurveConfigPDA } from "@/lib/pdas"
import { fetchPool, fetchUserPosition, fetchCurveConfig, calculateBuyOutput, calculateSellOutput, LiquidityPool, UserPosition, CurveConfiguration } from "@/lib/solana"

interface TradePanelProps {
  mint: PublicKey | null
  onTradeComplete?: () => void
}

export function TradePanel({ mint, onTradeComplete }: TradePanelProps) {
  const { connection } = useConnection()
  const { publicKey, connected } = useWallet()
  
  const [activeTab, setActiveTab] = useState("buy")
  const [amount, setAmount] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  
  const [pool, setPool] = useState<LiquidityPool | null>(null)
  const [position, setPosition] = useState<UserPosition | null>(null)
  const [config, setConfig] = useState<CurveConfiguration | null>(null)
  
  const [estimatedOutput, setEstimatedOutput] = useState(0)
  const [costBasis, setCostBasis] = useState(0)
  const [isAtLoss, setIsAtLoss] = useState(false)
  const [taxAmount, setTaxAmount] = useState(0)

  const fetchData = useCallback(async () => {
    if (!mint) return
    
    try {
      const [poolPDA] = getPoolPDA(mint)
      const [configPDA] = getCurveConfigPDA()
      
      const [poolData, configData] = await Promise.all([
        fetchPool(connection, poolPDA),
        fetchCurveConfig(connection, configPDA)
      ])
      
      setPool(poolData)
      setConfig(configData)
      
      if (publicKey) {
        const [positionPDA] = getUserPositionPDA(poolPDA, publicKey)
        const positionData = await fetchUserPosition(connection, positionPDA)
        setPosition(positionData)
      }
    } catch {
      // Silent fail - data will show as empty
    }
  }, [connection, mint, publicKey])

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 15000)
    return () => clearInterval(interval)
  }, [fetchData])

  useEffect(() => {
    if (!pool || !amount || isNaN(Number(amount))) {
      setEstimatedOutput(0)
      setCostBasis(0)
      setIsAtLoss(false)
      setTaxAmount(0)
      return
    }

    const feePct = config?.fees || 1

    if (activeTab === "buy") {
      const solAmount = Number(amount) * LAMPORTS_PER_SOL
      const tokensOut = calculateBuyOutput(
        solAmount,
        pool.reserveTwo.toNumber(),
        pool.reserveOne.toNumber(),
        feePct
      )
      setEstimatedOutput(tokensOut)
      setCostBasis(0)
      setIsAtLoss(false)
      setTaxAmount(0)
    } else {
      const tokenAmount = Number(amount) * 1_000_000
      const solOut = calculateSellOutput(
        tokenAmount,
        pool.reserveOne.toNumber(),
        pool.reserveTwo.toNumber(),
        feePct
      )
      setEstimatedOutput(solOut)
      
      if (position && position.totalTokens.toNumber() > 0) {
        const basis = calculateCostBasisForSale(
          position.totalSol.toNumber(),
          position.totalTokens.toNumber(),
          tokenAmount
        )
        setCostBasis(basis)
        
        const atLoss = isLoss(solOut, basis)
        setIsAtLoss(atLoss)
        
        if (atLoss && config) {
          const tax = calculateTax(solOut, config.paperhandTaxBps)
          setTaxAmount(tax)
        } else {
          setTaxAmount(0)
        }
      } else {
        setCostBasis(0)
        setIsAtLoss(false)
        setTaxAmount(0)
      }
    }
  }, [amount, activeTab, pool, position, config])

  const handleMaxClick = () => {
    if (activeTab === "buy") {
      setAmount("0.1")
    } else {
      if (position) {
        const maxTokens = position.totalTokens.toNumber() / 1_000_000
        setAmount(maxTokens.toString())
      }
    }
  }

  const handleTrade = async () => {
    if (!connected || !publicKey || !mint) return
    
    setIsLoading(true)
    try {
      // Trading logic would go here
      await fetchData()
      onTradeComplete?.()
      setAmount("")
    } catch {
      // Silent fail
    } finally {
      setIsLoading(false)
    }
  }

  const netSolReceived = estimatedOutput - taxAmount

  return (
    <TooltipProvider>
      <Card>
        <CardHeader>
          <CardTitle>Trade</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="buy">Buy</TabsTrigger>
              <TabsTrigger value="sell">Sell</TabsTrigger>
            </TabsList>

            <TabsContent value="buy" className="space-y-5">
              <div className="space-y-2">
                <label className="text-label">Amount (SOL)</label>
                <div className="relative">
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="pr-16 text-value"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-7 text-xs"
                    onClick={handleMaxClick}
                  >
                    MAX
                  </Button>
                </div>
              </div>

              <div className="divider-line" />

              <div className="space-y-2">
                <label className="text-label">You Receive</label>
                <div className="h-12 flex items-center px-4 rounded-xl bg-[#0E1518] border border-[#2A3338] text-[#E9E1D8] text-value">
                  {formatTokenAmount(estimatedOutput)} tokens
                </div>
              </div>

              <Button
                className="w-full"
                size="lg"
                onClick={handleTrade}
                disabled={!connected || !amount || isLoading}
              >
                {isLoading ? "Processing..." : "Buy"}
              </Button>
            </TabsContent>

            <TabsContent value="sell" className="space-y-5">
              <div className="space-y-2">
                <label className="text-label">Amount (Tokens)</label>
                <div className="relative">
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="pr-16 text-value"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-7 text-xs"
                    onClick={handleMaxClick}
                  >
                    MAX
                  </Button>
                </div>
              </div>

              {/* Penalty calculation block */}
              <div className={`rounded-xl border bg-[#0E1518] p-5 space-y-4 ${isAtLoss ? 'border-[#8C3A32]' : 'border-[#2A3338]'}`}>
                <div className="flex items-center justify-between">
                  <span className="text-label">Loss Status</span>
                  <Badge variant={isAtLoss ? "penalty" : "secondary"}>
                    {isAtLoss ? "LOSS" : "NO LOSS"}
                  </Badge>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#9FA6A3]">Cost basis</span>
                    <span className="text-[#E9E1D8] text-value">{formatLamportsToSol(costBasis)} SOL</span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-[#9FA6A3]">SOL out (pre-tax)</span>
                    <span className="text-[#E9E1D8] text-value">{formatLamportsToSol(estimatedOutput)} SOL</span>
                  </div>
                  
                  {isAtLoss && (
                    <>
                      <div className="divider-accent" />
                      <div className="flex justify-between text-sm">
                        <span className="text-[#8C3A32]">Penalty (50%)</span>
                        <span className="text-[#8C3A32] text-value">−{formatLamportsToSol(taxAmount)} SOL</span>
                      </div>
                    </>
                  )}
                  
                  <div className="divider-line pt-2" />
                  
                  <div className="flex justify-between pt-2">
                    <span className="text-[#E9E1D8] font-medium">You receive</span>
                    <span className={`font-medium text-value ${isAtLoss ? 'text-[#8C3A32]' : 'text-[#E9E1D8]'}`}>
                      {formatLamportsToSol(netSolReceived)} SOL
                    </span>
                  </div>
                </div>
              </div>

              {isAtLoss && (
                <div className="flex items-start gap-3 pl-3 border-l-2 border-[#8C3A32]">
                  <p className="text-sm text-[#9FA6A3]">
                    Selling below cost basis triggers a 50% reduction routed to protocol treasury.
                  </p>
                </div>
              )}

              <Button
                className="w-full"
                size="lg"
                variant={isAtLoss ? "danger" : "default"}
                onClick={handleTrade}
                disabled={!connected || !amount || isLoading}
              >
                {isLoading ? "Processing..." : isAtLoss ? "Sell (50% Penalty)" : "Sell"}
              </Button>
            </TabsContent>
          </Tabs>

          {!connected && (
            <p className="text-center text-sm text-[#5F6A6E]">Connect wallet to trade</p>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  )
}
