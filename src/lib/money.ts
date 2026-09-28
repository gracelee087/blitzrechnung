import BigNumber from "bignumber.js";
import type { VatRate } from "./types";

/** Normalises user input like "1.000,50" or "1000.5" into "1000.50". Returns null if invalid. */
export function parseEuroInput(input: string): string | null {
  let s = input.trim().replace(/\s|€/g, "");
  if (!s) return null;
  // German style "1.234,56" → "1234.56"; plain "1234,56" → "1234.56"
  if (s.includes(",")) s = s.replace(/\./g, "").replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(s)) return null;
  const n = new BigNumber(s);
  if (!n.isFinite() || n.lte(0)) return null;
  return n.toFixed(2);
}

export function grossFromNet(net: string, vatRate: VatRate): string {
  return new BigNumber(net)
    .multipliedBy(100 + vatRate)
    .dividedBy(100)
    .decimalPlaces(2, BigNumber.ROUND_HALF_UP)
    .toFixed(2);
}

export function vatAmount(net: string, gross: string): string {
  return new BigNumber(gross).minus(net).toFixed(2);
}

/** Decimal string → integer base units (e.g. EURC has 6 decimals). */
export function toBaseUnits(amount: string, decimals: number): bigint {
  const fixed = new BigNumber(amount).toFixed(decimals, BigNumber.ROUND_DOWN);
  return BigInt(fixed.replace(".", ""));
}

export function fromBaseUnits(units: bigint, decimals: number): string {
  return new BigNumber(units.toString()).shiftedBy(-decimals).toFixed(2);
}

/** "1234.5" → "1.234,50 €" (or "1.234,50 $") */
export function formatMoney(amount: string, currency: "EUR" | "USD" = "EUR"): string {
  return new Intl.NumberFormat("de-DE", { style: "currency", currency }).format(Number(amount));
}
export const formatEuro = (amount: string) => formatMoney(amount, "EUR");

/** "1234.5" → "1234,50" (German decimal comma, no thousands separator — DATEV style) */
export function datevAmount(amount: string): string {
  return new BigNumber(amount).toFixed(2).replace(".", ",");
}
