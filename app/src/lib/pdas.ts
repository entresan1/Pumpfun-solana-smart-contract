import { PublicKey } from "@solana/web3.js";
import { 
  PROGRAM_ID, 
  CURVE_CONFIG_SEED, 
  POOL_SEED_PREFIX, 
  POSITION_SEED, 
  TREASURY_VAULT_SEED,
  GLOBAL_SEED 
} from "./constants";

/**
 * Derive the CurveConfiguration PDA
 */
export function getCurveConfigPDA(): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(CURVE_CONFIG_SEED)],
    PROGRAM_ID
  );
}

/**
 * Derive the pool PDA for a given mint
 */
export function getPoolPDA(mint: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(POOL_SEED_PREFIX), mint.toBuffer()],
    PROGRAM_ID
  );
}

/**
 * Derive the user position PDA for tracking cost basis
 */
export function getUserPositionPDA(pool: PublicKey, user: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(POSITION_SEED), pool.toBuffer(), user.toBuffer()],
    PROGRAM_ID
  );
}

/**
 * Derive the treasury vault PDA
 */
export function getTreasuryVaultPDA(): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(TREASURY_VAULT_SEED)],
    PROGRAM_ID
  );
}

/**
 * Derive the global account PDA (holds pool SOL)
 */
export function getGlobalPDA(): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(GLOBAL_SEED)],
    PROGRAM_ID
  );
}

/**
 * Get all PDAs for a given mint
 */
export function getAllPDAs(mint: PublicKey) {
  const [curveConfig, curveConfigBump] = getCurveConfigPDA();
  const [pool, poolBump] = getPoolPDA(mint);
  const [treasuryVault, treasuryBump] = getTreasuryVaultPDA();
  const [global, globalBump] = getGlobalPDA();

  return {
    curveConfig,
    curveConfigBump,
    pool,
    poolBump,
    treasuryVault,
    treasuryBump,
    global,
    globalBump,
  };
}

