"use client";
import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Logo } from "@/components/Shell";
import { InvoiceDocument, transferUrlFor } from "@/components/InvoiceDocument";
import { usePayment } from "@/components/usePayment";
import { decodeShared } from "@/lib/share";
import { payWithBrowserWallet } from "@/lib/walletPay";
import { tokenFor } from "@/lib/config";

function PayView() {
  const data = useSearchParams().get("i") ?? "";
  const shared = useMemo(() => decodeShared(data), [data]);
  const params = useMemo(
    () =>
      shared
        ? {
            reference: shared.reference,
            recipient: shared.issuer.wallet,
            expected: shared.gross,
            mint: tokenFor(shared.currency).mint,
          }
        : null,
    [shared],
  );
  const { result, error, check, connection } = usePayment(params, 3000);
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState("");

  if (!shared) {
    return <p className="card p-8 text-center text-muted">This payment link is invalid or incomplete.</p>;
  }

  async function onWalletPay() {
    setPaying(true);
    setPayError("");
    try {
      await payWithBrowserWallet(connection, {
        recipient: shared!.issuer.wallet,
        amount: shared!.gross,
        reference: shared!.reference,
        mint: tokenFor(shared!.currency).mint,
        decimals: tokenFor(shared!.currency).decimals,
      });
      await check();
    } catch (e) {
      setPayError(e instanceof Error ? e.message : "Payment was not completed.");
    } finally {
      setPaying(false);
    }
  }

  const actions =
    result.state === "paid" ? null : (
      <div className="no-print flex w-full flex-col gap-2">
        <button className="btn-primary w-full" onClick={onWalletPay} disabled={paying}>
          {paying ? "Confirm in your wallet…" : "Pay with browser wallet"}
        </button>
        <a className="btn-ghost w-full" href={transferUrlFor(shared)}>
          Open in wallet app
        </a>
        {payError && <p className="text-center text-xs text-warn">{payError}</p>}
        {error && <p className="text-center text-xs text-muted">Checking the network… ({error})</p>}
      </div>
    );

  return (
    <>
      <InvoiceDocument s={shared} payment={result} actions={actions} />
      <p className="no-print mt-4 text-center text-xs text-muted">
        Payment settles in seconds on Solana. This page updates automatically.
      </p>
    </>
  );
}

export default function PayPage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:py-10">
      <div className="no-print mb-6">
        <Logo />
      </div>
      <Suspense fallback={<div className="card h-96 animate-pulse" />}>
        <PayView />
      </Suspense>
    </div>
  );
}
