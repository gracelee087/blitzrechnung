// Central configuration. Override any value with an environment variable in `.env.local`.

export const CLUSTER = (process.env.NEXT_PUBLIC_SOLANA_CLUSTER ?? "devnet") as "devnet" | "mainnet-beta";

export const RPC_URL =
  process.env.NEXT_PUBLIC_RPC_URL ??
  (CLUSTER === "devnet" ? "https://api.devnet.solana.com" : "https://api.mainnet-beta.solana.com");

// Circle EURC mint on Solana. Circle lists the same address for mainnet and devnet.
// Source: https://developers.circle.com/stablecoins/eurc-contract-addresses
export const EURC_MINT = process.env.NEXT_PUBLIC_EURC_MINT ?? "HzwqbKZw8HxMN6bF2yFZNrht3c2iXXzpKcFu7uBEDKtr";

export const EURC_DECIMALS = 6;

// Circle USDC on Solana (different mint on devnet vs mainnet).
// Source: https://developers.circle.com/stablecoins/usdc-contract-addresses
export const USDC_MINT =
  process.env.NEXT_PUBLIC_USDC_MINT ??
  (CLUSTER === "devnet" ? "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU" : "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");

export type Currency = "EUR" | "USD";

/** Which stablecoin pays an invoice in a given currency. Both have 6 decimals. */
export function tokenFor(currency: Currency): { mint: string; symbol: "EURC" | "USDC"; decimals: number } {
  return currency === "USD"
    ? { mint: USDC_MINT, symbol: "USDC", decimals: 6 }
    : { mint: EURC_MINT, symbol: "EURC", decimals: EURC_DECIMALS };
}

export const APP_NAME = "Blitzrechnung";

export function explorerTxUrl(signature: string): string {
  const q = CLUSTER === "devnet" ? "?cluster=devnet" : "";
  return `https://explorer.solana.com/tx/${signature}${q}`;
}
