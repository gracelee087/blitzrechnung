import type { Currency } from "./config";

export type VatRate = 0 | 7 | 19;

/** Where the client is — decides VAT treatment and the legally required invoice note. */
export type ClientType = "de" | "eu" | "intl";

/** The freelancer who issues invoices. Stored only in the browser. */
export interface Profile {
  name: string;
  address: string; // postal address shown on the invoice
  taxId: string; // Steuernummer or USt-IdNr (optional)
  wallet: string; // Solana address that receives EURC
  smallBusiness: boolean; // Kleinunternehmer (§ 19 UStG): no VAT charged
  // DATEV accounts (SKR03 defaults — confirm with your Steuerberater)
  datevCashAccount: string; // Geldkonto, e.g. a dedicated account for the EURC wallet
  datevRevenueAccount: string; // Erlöskonto, e.g. 8400 (19 %) in SKR03
  datevRevenueAccountEU: string; // e.g. 8336 in SKR03 (EU B2B, reverse charge)
  datevRevenueAccountIntl: string; // e.g. 8338 in SKR03 (non-EU, not taxable in Germany)
}

export type InvoiceStatus = "open" | "paid" | "underpaid";

export interface Invoice {
  currency: Currency; // EUR → paid in EURC, USD → paid in USDC
  clientType: ClientType;
  clientVatId: string; // required for EU reverse charge
  id: string; // = reference public key (unique per invoice)
  number: string; // e.g. RE-2026-001
  issueDate: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD
  clientName: string;
  clientEmail: string;
  description: string;
  net: string; // decimal string, EUR, e.g. "1000.00"
  vatRate: VatRate;
  gross: string; // decimal string, EUR — the amount the client pays
  reference: string; // Solana Pay reference key (base58)
  status: InvoiceStatus;
  paidAt?: string; // ISO timestamp from the block time
  detectedAt?: string; // ISO timestamp when the invoice page first saw the payment
  signature?: string; // transaction signature
  payer?: string; // wallet that paid
  receivedGross?: string; // what actually arrived (for underpaid)
}

/** What travels inside the public payment link. No private data beyond the invoice itself. */
export interface SharedInvoice {
  currency: Currency; // EUR → paid in EURC, USD → paid in USDC
  clientType: ClientType;
  clientVatId: string; // required for EU reverse charge
  v: 1;
  number: string;
  issueDate: string;
  dueDate: string;
  clientName: string;
  description: string;
  net: string;
  vatRate: VatRate;
  gross: string;
  reference: string;
  issuer: {
    name: string;
    address: string;
    taxId: string;
    wallet: string;
    smallBusiness: boolean;
  };
}
