"use client"

import { useState, useEffect, useCallback } from "react"
import { useConnection } from "@solana/wallet-adapter-react"
import { PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js"
import { getAssociatedTokenAddressSync } from "@solana/spl-token"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getPoolPDA, getGlobalPDA } from "@/lib/pdas"
import { TREASURY_WALLET } from "@/lib/constants"
import { RefreshCw, ExternalLink, ArrowUpRight, ArrowDownRight, Skull } from "lucide-react"

interface Trade {
    signature: string
    account: string  // Wallet address (truncated)
    type: "buy" | "sell" | "paperhand"
    solAmount: number
    tokenAmount: number
    time: string
    timestamp: number
}

interface TradesTableProps {
    mint: PublicKey
}

export function TradesTable({ mint }: TradesTableProps) {
    const { connection } = useConnection()
    const [trades, setTrades] = useState<Trade[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [tokenSymbol, setTokenSymbol] = useState("TOKEN")

    const fetchTrades = useCallback(async () => {
        setIsLoading(true)
        try {
            const [poolPDA] = getPoolPDA(mint)
            const treasuryVault = TREASURY_WALLET

            // Get recent signatures for the pool
            const signatures = await connection.getSignaturesForAddress(poolPDA, { limit: 20 })

            const parsedTrades: Trade[] = []

            for (const sig of signatures) {
                try {
                    const tx = await connection.getParsedTransaction(sig.signature, {
                        maxSupportedTransactionVersion: 0
                    })

                    if (!tx || !tx.meta) continue

                    // Calculate time
                    const timeDiff = Date.now() / 1000 - (sig.blockTime || 0)
                    let timeStr = ""
                    if (timeDiff < 60) timeStr = "just now"
                    else if (timeDiff < 3600) timeStr = `${Math.floor(timeDiff / 60)}m ago`
                    else if (timeDiff < 86400) timeStr = `${Math.floor(timeDiff / 3600)}h ago`
                    else timeStr = `${Math.floor(timeDiff / 86400)}d ago`

                    // Find the signer (user who made the trade)
                    const signerAccount = tx.transaction.message.accountKeys.find(
                        key => key.signer
                    )
                    const signer = signerAccount?.pubkey.toBase58() || "Unknown"
                    const truncatedAccount = signer.slice(0, 4) + "..." + signer.slice(-4)

                    // Parse balance changes
                    const preBalances = tx.meta.preBalances
                    const postBalances = tx.meta.postBalances

                    // Find SOL balance change for signer (index 0 is usually fee payer/signer)
                    const solChange = (postBalances[0] - preBalances[0]) / LAMPORTS_PER_SOL

                    // Parse token balance changes
                    const preTokenBalances = tx.meta.preTokenBalances || []
                    const postTokenBalances = tx.meta.postTokenBalances || []

                    // Derive pool token account to ignore its changes (minting/lp)
                    const [globalPDA] = getGlobalPDA()
                    const poolTokenAccount = getAssociatedTokenAddressSync(mint, globalPDA, true)

                    let tokenChange = 0
                    for (const post of postTokenBalances) {
                        const accountKey = tx.transaction.message.accountKeys[post.accountIndex].pubkey
                        // Skip if this is the pool's token account
                        if (accountKey.equals(poolTokenAccount)) continue

                        const pre = preTokenBalances.find(
                            p => p.accountIndex === post.accountIndex
                        )
                        const preAmount = pre?.uiTokenAmount.uiAmount || 0
                        const postAmount = post.uiTokenAmount.uiAmount || 0
                        const change = postAmount - preAmount

                        // Check if this is a user's token account (not the pool)
                        if (Math.abs(change) > 0) {
                            tokenChange = change
                            break
                        }
                    }

                    // Determine trade type
                    let type: "buy" | "sell" | "paperhand" = "buy"
                    let displaySolAmount = Math.abs(solChange)
                    let displayTokenAmount = Math.abs(tokenChange)

                    if (tokenChange > 0) {
                        // User received tokens = BUY
                        type = "buy"
                    } else if (tokenChange < 0) {
                        // User sent tokens = SELL
                        // Check if treasury received funds (paper hand)
                        const treasuryIndex = tx.transaction.message.accountKeys.findIndex(
                            key => key.pubkey.equals(treasuryVault)
                        )
                        if (treasuryIndex >= 0) {
                            const treasuryChange = postBalances[treasuryIndex] - preBalances[treasuryIndex]
                            if (treasuryChange > 0) {
                                type = "paperhand"
                            } else {
                                type = "sell"
                            }
                        } else {
                            type = "sell"
                        }
                    } else {
                        // Skip if no token change (might be liquidity add or other)
                        continue
                    }

                    // Skip trades with very small amounts (likely noise)
                    if (displayTokenAmount < 0.001 && displaySolAmount < 0.0001) continue

                    parsedTrades.push({
                        signature: sig.signature,
                        account: truncatedAccount,
                        type,
                        solAmount: displaySolAmount,
                        tokenAmount: displayTokenAmount,
                        time: timeStr,
                        timestamp: sig.blockTime || 0
                    })

                } catch (e) {
                    // Skip transactions we can't parse
                    continue
                }
            }

            // Sort by timestamp descending
            parsedTrades.sort((a, b) => b.timestamp - a.timestamp)
            setTrades(parsedTrades)

        } catch (e) {
            console.error("Failed to fetch trades:", e)
            setTrades([])
        } finally {
            setIsLoading(false)
        }
    }, [connection, mint])

    useEffect(() => {
        fetchTrades()
        const interval = setInterval(fetchTrades, 30000) // Refresh every 30s
        return () => clearInterval(interval)
    }, [fetchTrades])

    const getTypeIcon = (type: Trade["type"]) => {
        switch (type) {
            case "buy":
                return <ArrowUpRight className="w-4 h-4 text-green-400" />
            case "sell":
                return <ArrowDownRight className="w-4 h-4 text-yellow-400" />
            case "paperhand":
                return <Skull className="w-4 h-4 text-[#8C3A32]" />
        }
    }

    const getTypeBadge = (type: Trade["type"]) => {
        switch (type) {
            case "buy":
                return <Badge className="bg-green-900/30 text-green-400 border-green-500/30">🟢 Buy</Badge>
            case "sell":
                return <Badge className="bg-yellow-900/30 text-yellow-400 border-yellow-500/30">🔴 Sell</Badge>
            case "paperhand":
                return <Badge className="bg-[#8C3A32]/30 text-[#8C3A32] border-[#8C3A32]/30">💀 Paper Hand</Badge>
        }
    }

    const formatAmount = (amount: number) => {
        if (amount >= 1000000) return (amount / 1000000).toFixed(2) + "M"
        if (amount >= 1000) return (amount / 1000).toFixed(2) + "K"
        if (amount >= 1) return amount.toFixed(2)
        return amount.toFixed(6)
    }

    return (
        <Card>
            <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-1 h-8 bg-[#8C3A32]" />
                        <div>
                            <CardTitle className="text-lg">Recent Trades</CardTitle>
                            <p className="text-xs text-[#5F6A6E] mt-0.5">
                                Live transaction feed
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={fetchTrades}
                        disabled={isLoading}
                        className="p-2 rounded-lg hover:bg-[#1A2428] transition-colors disabled:opacity-50"
                    >
                        <RefreshCw className={`w-4 h-4 text-[#9FA6A3] ${isLoading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </CardHeader>
            <CardContent>
                {isLoading && trades.length === 0 ? (
                    <div className="flex items-center justify-center py-12">
                        <RefreshCw className="w-6 h-6 text-[#5F6A6E] animate-spin" />
                    </div>
                ) : trades.length === 0 ? (
                    <div className="text-center py-12 space-y-3">
                        <div className="w-12 h-12 rounded-full bg-[#0E1518] border border-[#2A3338] flex items-center justify-center mx-auto">
                            <ExternalLink className="w-5 h-5 text-[#5F6A6E]" />
                        </div>
                        <p className="text-sm text-[#5F6A6E]">No trades yet</p>
                        <p className="text-xs text-[#5F6A6E]">Transactions will appear here after trading</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-[#2A3338]">
                                    <th className="text-left py-3 px-2 text-xs font-medium text-[#5F6A6E] uppercase tracking-wider">Account</th>
                                    <th className="text-left py-3 px-2 text-xs font-medium text-[#5F6A6E] uppercase tracking-wider">Type</th>
                                    <th className="text-right py-3 px-2 text-xs font-medium text-[#5F6A6E] uppercase tracking-wider">SOL</th>
                                    <th className="text-right py-3 px-2 text-xs font-medium text-[#5F6A6E] uppercase tracking-wider">Tokens</th>
                                    <th className="text-right py-3 px-2 text-xs font-medium text-[#5F6A6E] uppercase tracking-wider">Time</th>
                                    <th className="text-center py-3 px-2 text-xs font-medium text-[#5F6A6E] uppercase tracking-wider">Txn</th>
                                </tr>
                            </thead>
                            <tbody>
                                {trades.map((trade) => (
                                    <tr
                                        key={trade.signature}
                                        className="border-b border-[#2A3338]/50 hover:bg-[#1A2428]/50 transition-colors"
                                    >
                                        <td className="py-3 px-2">
                                            <code className="text-sm text-[#9FA6A3] font-mono">{trade.account}</code>
                                        </td>
                                        <td className="py-3 px-2">
                                            {getTypeBadge(trade.type)}
                                        </td>
                                        <td className="py-3 px-2 text-right">
                                            <span className="text-sm text-[#E9E1D8] font-medium">
                                                {formatAmount(trade.solAmount)} SOL
                                            </span>
                                        </td>
                                        <td className="py-3 px-2 text-right">
                                            <span className="text-sm text-[#9FA6A3]">
                                                {formatAmount(trade.tokenAmount)}
                                            </span>
                                        </td>
                                        <td className="py-3 px-2 text-right">
                                            <span className="text-xs text-[#5F6A6E]">{trade.time}</span>
                                        </td>
                                        <td className="py-3 px-2 text-center">
                                            <a
                                                href={`https://solscan.io/tx/${trade.signature}?cluster=devnet`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-[#0E1518] border border-[#2A3338] hover:border-[#8C3A32] transition-colors"
                                            >
                                                <ExternalLink className="w-3.5 h-3.5 text-[#9FA6A3]" />
                                            </a>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
