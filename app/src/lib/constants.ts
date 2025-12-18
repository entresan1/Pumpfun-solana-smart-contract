import { PublicKey } from "@solana/web3.js";

// Program ID (deployed on mainnet)
export const PROGRAM_ID = new PublicKey("GyukgDYugNtzHiEdRroSiU5iFTCDJ1geAF2ekP6UbBTY");

// Token mint address for the pool
export const TOKEN_MINT = new PublicKey("ydDccyq66xKtfqn5bsRpfFXz4WeF4fh3bgQBx1npump");

// Dev/Treasury wallet
export const TREASURY_WALLET = new PublicKey("9zyRwPZBave48GLKRjdVfX6r725LfXR7dmzqwdBhKf5E");

// Seeds for PDAs
export const CURVE_CONFIG_SEED = "CurveConfiguration";
export const POOL_SEED_PREFIX = "liquidity_pool";
export const POSITION_SEED = "position";
export const TREASURY_VAULT_SEED = "treasury_vault";
export const GLOBAL_SEED = "global";

// Default paperhand tax: 50% = 5000 bps
export const DEFAULT_PAPERHAND_TAX_BPS = 5000;

// Lamports per SOL
export const LAMPORTS_PER_SOL = 1_000_000_000;

// Network
export const NETWORK = "mainnet-beta";

// QuickNode RPC endpoint (reliable mainnet RPC)
export const RPC_ENDPOINT = "https://small-twilight-sponge.solana-mainnet.quiknode.pro/71bdb31dd3e965467b1393cebaaebe69d481dbeb/";

// WebSocket endpoint
export const WS_ENDPOINT = "wss://small-twilight-sponge.solana-mainnet.quiknode.pro/71bdb31dd3e965467b1393cebaaebe69d481dbeb/";

// Supabase
export const SUPABASE_URL = "https://voskmcxmtvophehityoa.supabase.co";
export const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZvc2ttY3htdHZvcGhlaGl0eW9hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg1NTI1MDQsImV4cCI6MjA3NDEyODUwNH0.4sZOl1G7ZgCh0R_VSAULPm-KuPtLQ-013ivFn19VYVQ";
