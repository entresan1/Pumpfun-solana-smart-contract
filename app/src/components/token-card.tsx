"use client"

import { useState, useEffect, useCallback } from "react"
import { useConnection } from "@solana/wallet-adapter-react"
import { PublicKey } from "@solana/web3.js"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Copy, Check, ExternalLink, RefreshCw } from "lucide-react"
import { PROGRAM_ID, POOL_SEED_PREFIX } from "@/lib/constants"
import { BN } from "bn.js"

const TOKEN_METADATA_PROGRAM_ID = new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s")

interface TokenCardProps {
  mint: PublicKey
}

interface TokenData {
  name: string
  symbol: string
  image: string | null
  totalSupply: number
  decimals: number
}

export function TokenCard({ mint }: TokenCardProps) {
  const { connection } = useConnection()
  const [copied, setCopied] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [imageError, setImageError] = useState(false)
  const [data, setData] = useState<TokenData | null>(null)

  const fetchTokenData = useCallback(async () => {
    setIsLoading(true)
    try {
      // 1. Fetch Mint Info for supply/decimals
      const mintInfo = await connection.getParsedAccountInfo(mint)
      let decimals = 6
      let supply = 0

      if (mintInfo.value && 'parsed' in mintInfo.value.data) {
        decimals = mintInfo.value.data.parsed.info.decimals
        supply = Number(mintInfo.value.data.parsed.info.supply) / Math.pow(10, decimals)
      }

      // 2. Fetch Metadata
      let name = "Unknown Token"
      let symbol = "???"
      let image = null

      try {
        const [metadataPDA] = PublicKey.findProgramAddressSync(
          [
            Buffer.from("metadata"),
            TOKEN_METADATA_PROGRAM_ID.toBuffer(),
            mint.toBuffer(),
          ],
          TOKEN_METADATA_PROGRAM_ID
        )

        const metadataAccount = await connection.getAccountInfo(metadataPDA)
        if (metadataAccount) {
          // Parse standard Metaplex Metadata
          const data = metadataAccount.data
          let offset = 1 + 32 + 32 // key + update_auth + mint

          // Read name
          const nameLen = data.readUInt32LE(offset)
          offset += 4
          name = data.slice(offset, offset + 32).toString('utf8').replace(/\0/g, '').trim()
          offset += 32

          // Read symbol
          const symbolLen = data.readUInt32LE(offset)
          offset += 4
          symbol = data.slice(offset, offset + 10).toString('utf8').replace(/\0/g, '').trim()
          offset += 10

          // Read URI
          const uriLen = data.readUInt32LE(offset)
          offset += 4
          const uri = data.slice(offset, offset + uriLen).toString('utf8').replace(/\0/g, '').trim()

          // URI now stores the raw image URL directly (not JSON metadata)
          // Filter out invalid placeholder URLs from old launches
          const isValidImageUrl = uri &&
            uri.startsWith("http") &&
            !uri.includes("placeholder-") &&
            !uri.includes("arweave.net/placeholder")

          if (isValidImageUrl) {
            image = uri
          }
        }
      } catch (e) {
        console.error("Metadata fetch error:", e)
      }

      setData({
        name,
        symbol,
        image,
        totalSupply: supply,
        decimals
      })

    } catch (e) {
      console.error("Failed to fetch token data:", e)
    } finally {
      setIsLoading(false)
    }
  }, [connection, mint])

  useEffect(() => {
    fetchTokenData()
  }, [fetchTokenData])

  const copyCA = async () => {
    await navigator.clipboard.writeText(mint.toBase58())
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Display name/symbol - use placeholders if loading
  const displayName = data?.name || "Loading..."
  const displaySymbol = data?.symbol || "..."


  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {data?.image && !imageError ? (
              <img
                src={data.image}
                alt={displayName}
                className="w-12 h-12 rounded-full object-cover border border-[#2A3338]"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#8C3A32] to-[#A04438] flex items-center justify-center border border-[#2A3338]">
                <span className="text-[#E9E1D8] font-bold text-lg">{displaySymbol.slice(0, 2)}</span>
              </div>
            )}
            <div>
              <CardTitle className="text-xl">{displayName}</CardTitle>
              <span className="text-sm text-[#5F6A6E]">${displaySymbol}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isLoading && (
              <RefreshCw className="w-4 h-4 text-[#5F6A6E] animate-spin" />
            )}
            <Badge variant="secondary" className="border-[#8C3A32] text-[#8C3A32] bg-transparent">DEVNET</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* CA Section */}
        <div className="space-y-2">
          <label className="text-label">Contract Address (CA)</label>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-sm bg-[#0E1518] rounded-lg px-3 py-2.5 font-mono border border-[#2A3338] truncate text-[#9FA6A3]">
              {mint.toBase58()}
            </code>
            <Button
              variant="ghost"
              size="icon"
              onClick={copyCA}
              className="shrink-0 h-9 w-9 hover:bg-[#1A2428] hover:text-[#E9E1D8]"
            >
              {copied ? (
                <Check className="w-4 h-4 text-[#E9E1D8]" />
              ) : (
                <Copy className="w-4 h-4 text-[#5F6A6E]" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0 h-9 w-9 hover:bg-[#1A2428] hover:text-[#E9E1D8]"
              asChild
            >
              <a href={`https://solscan.io/token/${mint.toBase58()}?cluster=devnet`} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4 text-[#5F6A6E]" />
              </a>
            </Button>
          </div>
        </div>

        <div className="divider-line" />

        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 rounded-lg bg-[#0E1518] border border-[#2A3338]">
            <span className="text-xs text-[#5F6A6E] block mb-1">Total Supply</span>
            <span className="text-sm text-[#E9E1D8] text-value md:text-base">
              {data ? `${(data.totalSupply / 1_000_000).toLocaleString(undefined, { maximumFractionDigits: 0 })}M` : "--"}
            </span>
          </div>
          <div className="p-3 rounded-lg bg-[#0E1518] border border-[#2A3338]">
            <span className="text-xs text-[#5F6A6E] block mb-1">Decimals</span>
            <span className="text-sm text-[#E9E1D8] text-value md:text-base">{data?.decimals}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
