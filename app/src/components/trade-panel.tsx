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
import { MOCK_POOL_STATS, formatPrice } from "@/lib/mock-data"
import { AlertTriangle, ArrowDown, ArrowUp, Zap } from "lucide-react"

interface TradePanelProps {
  mint: PublicKey | null
  onTradeComplete?: () => void
}

// Mock position for demo
const MOCK_POSITION = {
  totalTokens: 2500000, // 2.5M tokens
  totalSol: 0.065 * LAMPORTS_PER_SOL, // 0.065 SOL spent
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
  
  // Use mock data as fallback
  const [useMockData, setUseMockData] = useState(true)
  
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
      
      if (poolData) {
        setPool(poolData)
        setUseMockData(false)
      }
      setConfig(configData)
      
      if (publicKey) {
        const [positionPDA] = getUserPositionPDA(poolPDA, publicKey)
        const positionData = await fetchUserPosition(connection, positionPDA)
        setPosition(positionData)
      }
    } catch {
      setUseMockData(true)
    }
  }, [connection, mint, publicKey])

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 15000)
    return () => clearInterval(interval)
  }, [fetchData])

  // Calculate estimates
  useEffect(() => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      setEstimatedOutput(0)
      setCostBasis(0)
      setIsAtLoss(false)
      setTaxAmount(0)
      return
    }

    const currentPrice = MOCK_POOL_STATS.price
    const taxBps = 5000 // 50%

    if (activeTab === "buy") {
      const solAmount = Number(amount)
      const tokensOut = Math.floor(solAmount / currentPrice)
      setEstimatedOutput(tokensOut)
      setCostBasis(0)
      setIsAtLoss(false)
      setTaxAmount(0)
    } else {
      const tokenAmount = Number(amount)
      const solOut = tokenAmount * currentPrice * LAMPORTS_PER_SOL
      setEstimatedOutput(solOut)
      
      // Calculate cost basis from mock position
      const mockTokens = MOCK_POSITION.totalTokens
      const mockSol = MOCK_POSITION.totalSol
      
      if (mockTokens > 0) {
        const basis = (mockSol * tokenAmount) / mockTokens
        setCostBasis(basis)
        
        const atLoss = solOut < basis
        setIsAtLoss(atLoss)
        
        if (atLoss) {
          const tax = Math.floor((solOut * taxBps) / 10000)
          setTaxAmount(tax)
        } else {
          setTaxAmount(0)
        }
      }
    }
  }, [amount, activeTab])

  const handleMaxClick = () => {
    if (activeTab === "buy") {
      setAmount("1.0")
    } else {
      setAmount((MOCK_POSITION.totalTokens / 1_000_000).toString())
    }
  }

  const handleTrade = async () => {
    if (!connected || !publicKey) {
      alert("Please connect your wallet")
      return
    }
    
    setIsLoading(true)
    
    // Simulate transaction
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    setIsLoading(false)
    onTradeComplete?.()
    setAmount("")
    
    alert(`${activeTab.toUpperCase()} transaction would be submitted here`)
  }

  const netSolReceived = estimatedOutput - taxAmount

  return (
    <TooltipProvider>
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle>Trade</CardTitle>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#5F6A6E]" />
              <span className="text-xs text-[#5F6A6E]">Bonding Curve</span>
            </div>
          </div>
          {/* Current price display */}
          <div className="flex items-center gap-2 mt-2">
            <span className="text-sm text-[#5F6A6E]">Price:</span>
            <span className="text-sm text-[#E9E1D8] text-value">${formatPrice(MOCK_POOL_STATS.price)}</span>
            <span className={`text-xs ${MOCK_POOL_STATS.priceChange24h < 0 ? 'text-[#8C3A32]' : 'text-[#9FA6A3]'}`}>
              {MOCK_POOL_STATS.priceChange24h > 0 ? '+' : ''}{MOCK_POOL_STATS.priceChange24h.toFixed(1)}%
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="buy" className="flex items-center gap-2">
                <ArrowUp className="w-4 h-4" />
                Buy
              </TabsTrigger>
              <TabsTrigger value="sell" className="flex items-center gap-2">
                <ArrowDown className="w-4 h-4" />
                Sell
              </TabsTrigger>
            </TabsList>

            <TabsContent value="buy" className="space-y-5">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-label">You Pay</label>
                  <span className="text-xs text-[#5F6A6E]">Balance: -- SOL</span>
                </div>
                <div className="relative">
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="pr-20 text-value text-lg"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs"
                      onClick={handleMaxClick}
                    >
                      MAX
                    </Button>
                    <span className="text-sm text-[#5F6A6E]">SOL</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-center">
                <div className="w-10 h-10 rounded-full bg-[#0E1518] border border-[#2A3338] flex items-center justify-center">
                  <ArrowDown className="w-4 h-4 text-[#5F6A6E]" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-label">You Receive</label>
                <div className="h-14 flex items-center justify-between px-4 rounded-xl bg-[#0E1518] border border-[#2A3338]">
                  <span className="text-[#E9E1D8] text-lg text-value">
                    {estimatedOutput > 0 ? formatTokenAmount(estimatedOutput) : "0.00"}
                  </span>
                  <span className="text-sm text-[#5F6A6E]">PHB</span>
                </div>
              </div>

              {/* Info box */}
              <div className="p-4 rounded-lg bg-[#0E1518] border border-[#2A3338] space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-[#5F6A6E]">Rate</span>
                  <span className="text-[#9FA6A3] text-value">1 SOL = {formatTokenAmount(1 / MOCK_POOL_STATS.price)} PHB</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#5F6A6E]">Slippage</span>
                  <span className="text-[#9FA6A3]">1%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#5F6A6E]">Platform fee</span>
                  <span className="text-[#9FA6A3]">1%</span>
                </div>
              </div>

              <Button
                className="w-full h-12"
                size="lg"
                onClick={handleTrade}
                disabled={!connected || !amount || Number(amount) <= 0 || isLoading}
              >
                {isLoading ? "Processing..." : !connected ? "Connect Wallet" : "Buy PHB"}
              </Button>
            </TabsContent>

            <TabsContent value="sell" className="space-y-5">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-label">You Sell</label>
                  <span className="text-xs text-[#5F6A6E]">
                    Position: {formatTokenAmount(MOCK_POSITION.totalTokens)} PHB
                  </span>
                </div>
                <div className="relative">
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="pr-20 text-value text-lg"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs"
                      onClick={handleMaxClick}
                    >
                      MAX
                    </Button>
                    <span className="text-sm text-[#5F6A6E]">PHB</span>
                  </div>
                </div>
              </div>

              {/* Tax calculation block */}
              <div className={`rounded-xl border bg-[#0E1518] p-5 space-y-4 transition-colors ${isAtLoss ? 'border-[#8C3A32]' : 'border-[#2A3338]'}`}>
                <div className="flex items-center justify-between">
                  <span className="text-label">Paper Hand Check</span>
                  <Badge variant={isAtLoss ? "penalty" : "secondary"}>
                    {isAtLoss ? "LOSS DETECTED" : "NO LOSS"}
                  </Badge>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#9FA6A3]">Your cost basis</span>
                    <span className="text-[#E9E1D8] text-value">{formatLamportsToSol(costBasis)} SOL</span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-[#9FA6A3]">Current value</span>
                    <span className="text-[#E9E1D8] text-value">{formatLamportsToSol(estimatedOutput)} SOL</span>
                  </div>
                  
                  {isAtLoss && (
                    <>
                      <div className="divider-accent" />
                      <div className="flex justify-between text-sm">
                        <span className="text-[#8C3A32] flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4" />
                          Paper Hand Tax (50%)
                        </span>
                        <span className="text-[#8C3A32] text-value font-medium">−{formatLamportsToSol(taxAmount)} SOL</span>
                      </div>
                    </>
                  )}
                  
                  <div className="divider-line pt-2" />
                  
                  <div className="flex justify-between pt-2">
                    <span className="text-[#E9E1D8] font-medium">You receive</span>
                    <span className={`font-medium text-lg text-value ${isAtLoss ? 'text-[#8C3A32]' : 'text-[#E9E1D8]'}`}>
                      {formatLamportsToSol(Math.max(0, netSolReceived))} SOL
                    </span>
                  </div>
                </div>
              </div>

              {isAtLoss && (
                <div className="flex items-start gap-3 p-3 rounded-lg border-l-2 border-[#8C3A32] bg-[#0E1518]">
                  <AlertTriangle className="w-5 h-5 text-[#8C3A32] shrink-0 mt-0.5" />
                  <p className="text-sm text-[#9FA6A3]">
                    Selling below your cost basis triggers a <span className="text-[#8C3A32] font-medium">50% penalty</span> routed to protocol treasury. 
                    Diamond hands pay no tax.
                  </p>
                </div>
              )}

              <Button
                className="w-full h-12"
                size="lg"
                variant={isAtLoss ? "danger" : "default"}
                onClick={handleTrade}
                disabled={!connected || !amount || Number(amount) <= 0 || isLoading}
              >
                {isLoading ? "Processing..." : 
                 !connected ? "Connect Wallet" : 
                 isAtLoss ? `Sell (50% Tax Applied)` : "Sell PHB"}
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
