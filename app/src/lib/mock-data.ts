// Mock data for realistic display when on-chain data isn't available

export const MOCK_TOKEN_INFO = {
  name: "Paper Hand Bitch",
  symbol: "PHB",
  decimals: 6,
  supply: 1_000_000_000,
  ca: "", // Contract Address - leave empty for now
}

export const MOCK_POOL_STATS = {
  price: 0.00002847,
  priceChange24h: -12.4,
  volume24h: 4872.5,
  marketCap: 28470,
  holders: 847,
  transactions24h: 2341,
  allTimeHigh: 0.00005123,
  athDate: "Dec 15, 2024",
}

export const MOCK_TREASURY_STATS = {
  totalCollected: 127.45,
  taxesPaid: 1847,
  avgTaxPerSell: 0.069,
  biggestTax: 4.2,
}

export const MOCK_RECENT_TRADES = [
  { type: "sell", amount: 125000, sol: 0.0032, taxed: true, time: "2m ago", wallet: "8xK4...9pQm" },
  { type: "buy", amount: 500000, sol: 0.0145, taxed: false, time: "5m ago", wallet: "3nRt...wVzL" },
  { type: "sell", amount: 250000, sol: 0.0067, taxed: false, time: "8m ago", wallet: "7bYq...kH2J" },
  { type: "sell", amount: 890000, sol: 0.0234, taxed: true, time: "12m ago", wallet: "2cPx...nM5W" },
  { type: "buy", amount: 1200000, sol: 0.0356, taxed: false, time: "15m ago", wallet: "9fLs...tQ8R" },
  { type: "sell", amount: 75000, sol: 0.0019, taxed: true, time: "18m ago", wallet: "4dNv...yE6K" },
  { type: "buy", amount: 320000, sol: 0.0089, taxed: false, time: "22m ago", wallet: "6aWm...gJ3P" },
  { type: "sell", amount: 1500000, sol: 0.0412, taxed: true, time: "25m ago", wallet: "1hXz...rC7D" },
]

export const MOCK_TOP_PAPERHAND = [
  { wallet: "8xK4...9pQm", taxPaid: 4.21, sells: 12 },
  { wallet: "2cPx...nM5W", taxPaid: 3.87, sells: 8 },
  { wallet: "4dNv...yE6K", taxPaid: 2.45, sells: 15 },
  { wallet: "1hXz...rC7D", taxPaid: 2.12, sells: 6 },
  { wallet: "5gBn...xA9F", taxPaid: 1.89, sells: 9 },
]

// Simulate price updates
export function getRandomPriceMovement(currentPrice: number): number {
  const change = (Math.random() - 0.5) * 0.00000050
  return Math.max(0.00000100, currentPrice + change)
}

export function formatNumber(num: number, decimals = 2): string {
  if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(decimals) + "M"
  }
  if (num >= 1_000) {
    return (num / 1_000).toFixed(decimals) + "K"
  }
  return num.toFixed(decimals)
}

export function formatPrice(price: number): string {
  if (price < 0.0001) {
    return price.toFixed(8)
  }
  if (price < 0.01) {
    return price.toFixed(6)
  }
  return price.toFixed(4)
}

