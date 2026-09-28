"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { PublicKey } from "@solana/web3.js";
import { Shell } from "@/components/Shell";
import { saveProfile, useProfile } from "@/lib/storage";
import type { Profile } from "@/lib/types";

function isValidWallet(w: string) {
  try {
    new PublicKey(w);
    return true;
  } catch {
    return false;
  }
}

export default function SettingsPage() {
  const stored = useProfile();
  return (
    <Shell>
      <h1 className="mb-1 text-2xl font-bold">Your business</h1>
      <p className="mb-6 text-sm text-muted">Shown on your invoices. Saved only in this browser.</p>
      {stored ? <SettingsForm initial={stored} /> : <div className="card h-96 animate-pulse" />}
    </Shell>
  );
}

function SettingsForm({ initial }: { initial: Profile }) {
  const router = useRouter();
  const [p, setP] = useState<Profile>(initial);
  const [error, setError] = useState("");

  const set = <K extends keyof Profile>(k: K, v: Profile[K]) => setP((prev) => ({ ...prev, [k]: v }));

  function onSave(e: React.FormEvent) {
    e.preventDefault();
    if (!p.name.trim()) return setError("Please enter your name or business name.");
    if (!isValidWallet(p.wallet.trim())) return setError("That doesn't look like a Solana wallet address. Copy it from Phantom.");
    saveProfile({ ...p, wallet: p.wallet.trim() });
    router.push("/");
  }

  return (
    <form onSubmit={onSave} className="card space-y-5 p-6">
      <div>
        <label className="label">Name / business name</label>
        <input className="input" value={p.name} onChange={(e) => set("name", e.target.value)} placeholder="Anna Müller Design" />
      </div>
      <div>
        <label className="label">Address</label>
        <textarea
          className="input"
          rows={2}
          value={p.address}
          onChange={(e) => set("address", e.target.value)}
          placeholder={"Musterstraße 1\n60311 Frankfurt am Main"}
        />
      </div>
      <div>
        <label className="label">Steuernummer / USt-IdNr. (optional)</label>
        <input className="input" value={p.taxId} onChange={(e) => set("taxId", e.target.value)} placeholder="DE123456789" />
      </div>
      <div>
        <label className="label">Your Solana wallet (receives EURC and USDC)</label>
        <input
          className="input font-mono"
          value={p.wallet}
          onChange={(e) => set("wallet", e.target.value)}
          placeholder="Paste your Phantom address"
        />
      </div>
      <label className="flex items-start gap-3 text-sm">
        <input
          type="checkbox"
          className="mt-1"
          checked={p.smallBusiness}
          onChange={(e) => set("smallBusiness", e.target.checked)}
        />
        <span>
          <b>Kleinunternehmer (§ 19 UStG)</b> — I don&apos;t charge VAT.
        </span>
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">DATEV Geldkonto</label>
          <input className="input" value={p.datevCashAccount} onChange={(e) => set("datevCashAccount", e.target.value)} />
        </div>
        <div>
          <label className="label">DATEV Erlöskonto</label>
          <input className="input" value={p.datevRevenueAccount} onChange={(e) => set("datevRevenueAccount", e.target.value)} />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Erlöskonto EU (Reverse Charge)</label>
          <input
            className="input"
            value={p.datevRevenueAccountEU}
            onChange={(e) => set("datevRevenueAccountEU", e.target.value)}
          />
        </div>
        <div>
          <label className="label">Erlöskonto Drittland</label>
          <input
            className="input"
            value={p.datevRevenueAccountIntl}
            onChange={(e) => set("datevRevenueAccountIntl", e.target.value)}
          />
        </div>
      </div>
      <p className="text-xs text-muted">
        Defaults follow SKR03 (1360 Geldtransit, 8400 Erlöse 19 %, 8336 EU Reverse Charge, 8338 Drittland). Please confirm the
        accounts with your Steuerberater.
      </p>
      {error && <p className="rounded-xl bg-warn-soft px-3 py-2 text-sm text-warn">{error}</p>}
      <button className="btn-primary w-full">Save</button>
    </form>
  );
}
