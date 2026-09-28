"use client";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Shell } from "@/components/Shell";
import { InvoiceDocument } from "@/components/InvoiceDocument";
import { usePayment } from "@/components/usePayment";
import { upsertInvoice, useInvoices, useProfile } from "@/lib/storage";
import { payLink, toShared } from "@/lib/share";
import type { Invoice } from "@/lib/types";
import { tokenFor } from "@/lib/config";

/** The freelancer's view of one invoice: share link + live payment status. */
function InvoiceView() {
  const id = useSearchParams().get("id") ?? "";
  const invoices = useInvoices();
  const profile = useProfile();
  const [copied, setCopied] = useState(false);
  const inv: Invoice | null | undefined = invoices === null ? undefined : (invoices.find((x) => x.id === id) ?? null);

  const shared = useMemo(() => (inv && profile ? toShared(inv, profile) : null), [inv, profile]);
  const params = useMemo(
    () =>
      inv && profile
        ? { reference: inv.reference, recipient: profile.wallet, expected: inv.gross, mint: tokenFor(inv.currency).mint }
        : null,
    [inv, profile],
  );
  const { result } = usePayment(params, 3000);

  // Save the payment into the local invoice list once detected (storage hook re-renders us).
  useEffect(() => {
    if (!inv || result.state === "none") return;
    if (inv.status === result.state && inv.signature === result.signature) return;
    const updated: Invoice = {
      ...inv,
      status: result.state,
      paidAt: result.paidAt ?? new Date().toISOString(),
      detectedAt: inv.detectedAt ?? new Date().toISOString(),
      signature: result.signature,
      payer: result.payer ?? undefined,
      receivedGross: result.received,
    };
    upsertInvoice(updated);
  }, [result, inv]);

  if (inv === undefined) return <div className="card h-96 animate-pulse" />;
  if (!inv || !shared) return <p className="card p-8 text-center text-muted">Invoice not found in this browser.</p>;

  const link = payLink(window.location.origin, shared);

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked — the link is visible below */
    }
  }

  return (
    <>
      <div className="no-print card mb-6 p-4">
        <p className="label">Payment link for your client</p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input readOnly className="input font-mono text-xs" value={link} onFocus={(e) => e.target.select()} />
          <button className="btn-primary shrink-0" onClick={copy}>
            {copied ? "Copied ✓" : "Copy link"}
          </button>
          <a className="btn-ghost shrink-0" href={link} target="_blank" rel="noreferrer">
            Open
          </a>
          <button className="btn-ghost shrink-0" onClick={() => window.print()}>
            Print / PDF
          </button>
        </div>
      </div>
      <InvoiceDocument s={shared} payment={result} />
      <div className="no-print mt-6 text-center">
        <Link href="/" className="text-sm text-accent underline">
          ← All invoices
        </Link>
      </div>
    </>
  );
}

export default function InvoicePage() {
  return (
    <Shell>
      <Suspense fallback={<div className="card h-96 animate-pulse" />}>
        <InvoiceView />
      </Suspense>
    </Shell>
  );
}
