import type { Invoice, Profile } from "./types";
import { datevAmount } from "./money";
import { revenueAccountFor } from "./tax";

/**
 * Simplified DATEV-compatible booking list (Buchungsstapel columns, semicolon-separated,
 * German number format). One row per paid invoice:
 *   Geldkonto (EURC wallet) an Erlöskonto.
 *
 * USD invoices are exported with WKZ "USD"; the Steuerberater applies the EUR rate of the payment day.
 *
 * Note for the roadmap: a full DATEV "EXTF" import file additionally needs the
 * EXTF header line (Berater-/Mandantennummer, Wirtschaftsjahr, …). Many
 * Steuerberater accept this simplified format for manual import/review.
 */
export const DATEV_COLUMNS = [
  "Umsatz (ohne Soll/Haben-Kz)",
  "Soll/Haben-Kennzeichen",
  "WKZ Umsatz",
  "Konto",
  "Gegenkonto (ohne BU-Schlüssel)",
  "BU-Schlüssel",
  "Belegdatum",
  "Belegfeld 1",
  "Buchungstext",
  "Zusatzinformation",
] as const;

function quote(text: string): string {
  return `"${text.replace(/"/g, '""')}"`;
}

/** YYYY-MM-DD or ISO → DDMM (DATEV Belegdatum format) */
export function datevDate(iso: string): string {
  const d = iso.slice(0, 10).split("-");
  return `${d[2]}${d[1]}`;
}

export function buildDatevCsv(invoices: Invoice[], profile: Profile): string {
  const rows = invoices
    .filter((i) => i.status === "paid" && i.paidAt)
    .sort((a, b) => (a.paidAt! < b.paidAt! ? -1 : 1))
    .map((i) =>
      [
        datevAmount(i.gross),
        "S",
        i.currency ?? "EUR",
        profile.datevCashAccount,
        revenueAccountFor(i.clientType ?? "de", profile),
        "",
        datevDate(i.paidAt!),
        quote(i.number.slice(0, 36)),
        quote(`${i.number} ${i.clientName} ${i.currency === "USD" ? "USDC" : "EURC"}`.slice(0, 60)),
        quote(i.signature ? `Solana Tx ${i.signature}` : ""),
      ].join(";"),
    );
  const header = DATEV_COLUMNS.map(quote).join(";");
  return [header, ...rows].join("\r\n") + "\r\n";
}
