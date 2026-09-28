"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Connection } from "@solana/web3.js";
import BigNumber from "bignumber.js";
import { Shell } from "@/components/Shell";
import { StatusBadge } from "@/components/StatusBadge";
import { RPC_URL, explorerTxUrl, tokenFor } from "@/lib/config";
import { loadInvoices, saveInvoices, useInvoices, useProfile } from "@/lib/storage";
import { checkPayment } from "@/lib/verify";
import { buildDatevCsv } from "@/lib/datev";
import { formatMoney } from "@/lib/money";
import type { Invoice, Profile } from "@/lib/types";
import { localDate } from "@/lib/dates";
import { avgDetectionSeconds, paypalFeeEstimate } from "@/lib/stats";

export default function Dashboard() {
  const storedInvoices = useInvoices();
  const profile = useProfile();
  const invoices = useMemo(() => storedInvoices ?? [], [storedInvoices]);
  const loaded = storedInvoices !== null && profile !== null;
  const [checking, setChecking] = useState(false);
  const [offline, setOffline] = useState(false);

  const refresh = useCallback(async (list: Invoice[], p: Profile) => {
    const open = list.filter((i) => i.status !== "paid");
    if (!open.length || !p.wallet) return;
    setChecking(true);
    const connection = new Connection(RPC_URL, "confirmed");
    const updated = [...loadInvoices()];
    let failures = 0;
    for (const inv of open) {
      try {
        const r = await checkPayment(connection, {
          reference: inv.reference,
          recipient: p.wallet,
          mint: tokenFor(inv.currency).mint,
          expected: inv.gross,
        });
        if (r.state !== "none") {
          const i = updated.findIndex((x) => x.id === inv.id);
          if (i >= 0)
            updated[i] = {
              ...inv,
              status: r.state,
              paidAt: r.paidAt ?? new Date().toISOString(),
              signature: r.signature,
              payer: r.payer ?? undefined,
              receivedGross: r.received,
            };
        }
      } catch {
        failures++; // network hiccup — try again on next refresh
      }
    }
    saveInvoices(updated);
    setOffline(failures > 0 && failures === open.length);
    setChecking(false);
  }, []);

  // Check open invoices against the chain once when the dashboard opens.
  const [autoChecked, setAutoChecked] = useState(false);
  useEffect(() => {
    if (!loaded || autoChecked || !profile) return;
    const t = setTimeout(() => {
      setAutoChecked(true);
      refresh(invoices, profile);
    }, 0);
    return () => clearTimeout(t);
  }, [loaded, autoChecked, profile, invoices, refresh]);

  const totals = useMemo(() => {
    // Totals per currency, e.g. "1.190,00 € · 500,00 $"
    const sum = (xs: Invoice[]) =>
      (["EUR", "USD"] as const)
        .map((c) => ({ c, v: xs.filter((i) => i.currency === c).reduce((a, i) => a.plus(i.gross), new BigNumber(0)) }))
        .filter((t, idx) => idx === 0 || t.v.gt(0))
        .map((t) => formatMoney(t.v.toFixed(2), t.c))
        .join(" · ");
    const paidList = invoices.filter((i) => i.status === "paid");
    const saved = (["EUR", "USD"] as const)
      .map((c) => ({
        c,
        v: paidList
          .filter((i) => i.currency === c)
          .reduce((a, i) => a.plus(paypalFeeEstimate(i.gross, i.clientType ?? "de")), new BigNumber(0)),
      }))
      .filter((t, idx) => idx === 0 || t.v.gt(0))
      .map((t) => formatMoney(t.v.toFixed(2), t.c))
      .join(" · ");
    return {
      paid: sum(paidList),
      open: sum(invoices.filter((i) => i.status !== "paid")),
      count: paidList.length,
      saved,
      avgSeconds: avgDetectionSeconds(invoices),
    };
  }, [invoices]);

  function exportDatev() {
    if (!profile) return;
    const csv = "﻿" + buildDatevCsv(invoices, profile);
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `DATEV-Buchungsstapel-${localDate()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (!loaded)
    return (
      <Shell>
        <div className="card h-64 animate-pulse" />
      </Shell>
    );

  if (!profile?.wallet) {
    return (
      <Shell>
        <section className="card p-8 sm:p-12">
          <p className="text-sm font-semibold text-accent">For freelancers in Germany</p>
          <h1 className="mt-2 text-3xl font-bold leading-tight sm:text-4xl">Send an invoice. Get paid in seconds.</h1>
          <p className="mt-3 max-w-xl text-muted">
            Every invoice gets a payment QR. Your client pays in EURC (a regulated euro stablecoin) on Solana — the money arrives
            in about a second, with near-zero fees. One click exports your bookings for DATEV.
          </p>
          <Link href="/settings" className="btn-primary mt-6">
            Get started
          </Link>
        </section>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="mb-4 grid gap-4 sm:grid-cols-3">
        <div className="card p-5">
          <p className="label">Received</p>
          <p className="text-2xl font-bold">{totals.paid}</p>
          <p className="text-xs text-muted">{totals.count} paid invoices</p>
        </div>
        <div className="card p-5">
          <p className="label">Outstanding</p>
          <p className="text-2xl font-bold">{totals.open}</p>
          <p className="text-xs text-muted">
            {checking ? "Checking Solana…" : offline ? "Can't reach Solana — try Refresh" : "Up to date"}
          </p>
        </div>
        <div className="card flex flex-col justify-between gap-3 p-5">
          <p className="label">Bookkeeping</p>
          <button className="btn-ghost" onClick={exportDatev} disabled={totals.count === 0}>
            Export for DATEV
          </button>
        </div>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <div className="card p-5">
          <p className="label">Saved vs. PayPal (est.)</p>
          <p className="text-2xl font-bold text-accent">{totals.saved}</p>
          <p className="text-xs text-muted">PayPal Checkout 2.99 % + 1.99 % outside the EEA, fixed fee not counted</p>
        </div>
        <div className="card p-5">
          <p className="label">Avg. time to &ldquo;Paid&rdquo;</p>
          <p className="text-2xl font-bold text-accent">
            {totals.avgSeconds === null ? "—" : `${totals.avgSeconds.toFixed(1)} s`}
          </p>
          <p className="text-xs text-muted">From the Solana block to this app showing Paid</p>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-line px-5 py-3">
          <h2 className="font-semibold">Invoices</h2>
          <button className="text-sm text-accent" onClick={() => profile && refresh(invoices, profile)} disabled={checking}>
            {checking ? "Checking…" : "Refresh"}
          </button>
        </div>
        {invoices.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-muted">No invoices yet.</p>
            <Link href="/new" className="btn-primary mt-4">
              Create your first invoice
            </Link>
          </div>
        ) : (
          <ul>
            {invoices.map((i) => (
              <li key={i.id} className="flex items-center border-b border-line last:border-0 hover:bg-paper">
                <Link href={`/invoice?id=${i.id}`} className="flex min-w-0 flex-1 items-center gap-4 px-5 py-4">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{i.clientName}</p>
                    <p className="truncate text-sm text-muted">
                      {i.number} · {i.description}
                    </p>
                  </div>
                  <p className="font-semibold tabular-nums">{formatMoney(i.gross, i.currency)}</p>
                  <StatusBadge status={i.status} dueDate={i.dueDate} />
                </Link>
                {i.signature && (
                  <a
                    href={explorerTxUrl(i.signature)}
                    target="_blank"
                    rel="noreferrer"
                    className="shrink-0 pr-5 text-xs text-accent underline"
                  >
                    On-chain ↗
                  </a>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </Shell>
  );
}
