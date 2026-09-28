import BigNumber from "bignumber.js";
import type { ClientType, Invoice } from "./types";

/**
 * Conservative estimate of what PayPal Checkout would have charged for this invoice.
 * PayPal DE business fees: 2.99 % base, +1.99 % for senders outside the EEA.
 * The fixed per-transaction fee is left out on purpose, so the estimate stays on the low side.
 * Source: https://www.paypal.com/de/business/paypal-business-fees
 */
export function paypalFeeEstimate(gross: string, clientType: ClientType): string {
  const percent = clientType === "intl" ? 4.98 : 2.99;
  return new BigNumber(gross).multipliedBy(percent).dividedBy(100).decimalPlaces(2, BigNumber.ROUND_DOWN).toFixed(2);
}

/**
 * Average seconds between the payment landing on-chain (block time) and the app showing it as paid.
 * Only invoices watched live (with `detectedAt`) count. Returns null when there is nothing to average.
 */
export function avgDetectionSeconds(invoices: Invoice[]): number | null {
  const secs = invoices
    .filter((i) => i.status === "paid" && i.paidAt && i.detectedAt)
    .map((i) => (Date.parse(i.detectedAt!) - Date.parse(i.paidAt!)) / 1000)
    .filter((s) => Number.isFinite(s) && s >= 0);
  if (!secs.length) return null;
  return secs.reduce((a, s) => a + s, 0) / secs.length;
}
