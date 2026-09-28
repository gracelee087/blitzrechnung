import type { Invoice, Profile, SharedInvoice } from "./types";

// The public payment link carries the invoice itself (no database needed for the MVP).
// The blockchain is the source of truth for whether it was paid.

function toBase64Url(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(data: string): string {
  const b64 = data.replace(/-/g, "+").replace(/_/g, "/");
  const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
  const bin = atob(padded);
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export function toShared(inv: Invoice, profile: Profile): SharedInvoice {
  return {
    v: 1,
    number: inv.number,
    currency: inv.currency,
    clientType: inv.clientType,
    clientVatId: inv.clientVatId,
    issueDate: inv.issueDate,
    dueDate: inv.dueDate,
    clientName: inv.clientName,
    description: inv.description,
    net: inv.net,
    vatRate: inv.vatRate,
    gross: inv.gross,
    reference: inv.reference,
    issuer: {
      name: profile.name,
      address: profile.address,
      taxId: profile.taxId,
      wallet: profile.wallet,
      smallBusiness: profile.smallBusiness,
    },
  };
}

export function encodeShared(s: SharedInvoice): string {
  return toBase64Url(JSON.stringify(s));
}

export function decodeShared(data: string): SharedInvoice | null {
  try {
    const s = JSON.parse(fromBase64Url(data)) as SharedInvoice;
    if (s?.v !== 1 || !s.reference || !s.issuer?.wallet || !s.gross) return null;
    return { ...s, currency: s.currency ?? "EUR", clientType: s.clientType ?? "de", clientVatId: s.clientVatId ?? "" };
  } catch {
    return null;
  }
}

export function payLink(origin: string, s: SharedInvoice): string {
  return `${origin}/pay?i=${encodeShared(s)}`;
}
