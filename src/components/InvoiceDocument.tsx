"use client";
import { QrCode } from "./QrCode";
import { formatMoney, vatAmount } from "@/lib/money";
import { taxNote } from "@/lib/tax";
import { buildTransferUrl } from "@/lib/solanaPay";
import { explorerTxUrl, tokenFor } from "@/lib/config";
import type { SharedInvoice } from "@/lib/types";
import type { PaymentCheck } from "@/lib/verify";

const de = (iso: string) => new Date(iso).toLocaleDateString("de-DE");

export function transferUrlFor(s: SharedInvoice) {
  return buildTransferUrl({
    recipient: s.issuer.wallet,
    amount: s.gross,
    reference: s.reference,
    label: s.issuer.name,
    message: `Rechnung ${s.number}`,
    memo: s.number,
    mint: tokenFor(s.currency).mint,
  });
}

/** The invoice as the client sees it — also printable to PDF. */
export function InvoiceDocument({ s, payment, actions }: { s: SharedInvoice; payment: PaymentCheck; actions?: React.ReactNode }) {
  const paid = payment.state === "paid";
  const money = (a: string) => formatMoney(a, s.currency);
  const symbol = tokenFor(s.currency).symbol;
  const note = taxNote(s.clientType, s.issuer.smallBusiness);
  return (
    <div className="card overflow-hidden">
      <div className="grid gap-8 p-6 sm:grid-cols-[1fr_auto] sm:p-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Rechnung / Invoice</p>
          <h1 className="mt-1 text-2xl font-bold">{s.number}</h1>
          <div className="mt-6 grid gap-6 text-sm sm:grid-cols-2">
            <div>
              <p className="label">From</p>
              <p className="font-semibold">{s.issuer.name}</p>
              <p className="whitespace-pre-line text-muted">{s.issuer.address}</p>
              {s.issuer.taxId && <p className="text-muted">St.-Nr./USt-IdNr.: {s.issuer.taxId}</p>}
            </div>
            <div>
              <p className="label">To</p>
              <p className="font-semibold">{s.clientName}</p>
              {s.clientVatId && <p className="text-muted">USt-IdNr.: {s.clientVatId}</p>}
              <p className="mt-3 text-muted">Date: {de(s.issueDate)}</p>
              <p className="text-muted">Due: {de(s.dueDate)}</p>
            </div>
          </div>
          <table className="mt-8 w-full text-sm">
            <tbody>
              <tr className="border-b border-line">
                <td className="py-2">{s.description}</td>
                <td className="py-2 text-right">{money(s.net)}</td>
              </tr>
              <tr className="text-muted">
                <td className="py-1">USt. {s.vatRate} %</td>
                <td className="py-1 text-right">{money(vatAmount(s.net, s.gross))}</td>
              </tr>
              <tr className="text-lg font-bold">
                <td className="pt-2">Total</td>
                <td className="pt-2 text-right">{money(s.gross)}</td>
              </tr>
            </tbody>
          </table>
          {note && <p className="mt-4 text-xs text-muted">{note}</p>}
        </div>

        <div className="flex flex-col items-center gap-3 sm:w-64">
          {paid ? (
            <div className="flex h-60 w-60 flex-col items-center justify-center rounded-2xl bg-ok-soft text-ok">
              <svg viewBox="0 0 24 24" className="h-16 w-16" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
                <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <p className="mt-2 text-lg font-bold">Paid</p>
              {payment.paidAt && <p className="text-xs">{new Date(payment.paidAt).toLocaleString("de-DE")}</p>}
            </div>
          ) : (
            <>
              <QrCode value={transferUrlFor(s)} size={240} />
              <p className="text-center text-xs text-muted">
                Scan with Phantom or any Solana Pay wallet to pay <b className="text-ink">{money(s.gross)}</b> in {symbol}
              </p>
            </>
          )}
          {payment.state === "underpaid" && (
            <p className="rounded-xl bg-warn-soft px-3 py-2 text-center text-xs text-warn">
              Received {money(payment.received)} of {money(s.gross)}
            </p>
          )}
          {payment.state !== "none" && (
            <a className="text-xs text-accent underline" href={explorerTxUrl(payment.signature)} target="_blank" rel="noreferrer">
              View transaction
            </a>
          )}
          {actions}
        </div>
      </div>
    </div>
  );
}
