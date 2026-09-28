"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Keypair } from "@solana/web3.js";
import { Shell } from "@/components/Shell";
import { nextInvoiceNumber, upsertInvoice, useProfile } from "@/lib/storage";
import { formatMoney, grossFromNet, parseEuroInput, vatAmount } from "@/lib/money";
import { CLIENT_TYPES, isZeroVat, taxNote } from "@/lib/tax";
import { tokenFor, type Currency } from "@/lib/config";
import { localDate } from "@/lib/dates";
import type { ClientType, Invoice, VatRate } from "@/lib/types";

export default function NewInvoicePage() {
  const router = useRouter();
  const profile = useProfile();
  const [number, setNumber] = useState("");
  const [clientType, setClientType] = useState<ClientType>("intl");
  const [clientName, setClientName] = useState("");
  const [clientVatId, setClientVatId] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState<Currency>("USD");
  const [vatChoice, setVatRate] = useState<VatRate>(19);
  const [dueDate, setDueDate] = useState(localDate(14));
  const [error, setError] = useState("");

  const smallBusiness = profile?.smallBusiness ?? false;
  const zeroVat = isZeroVat(clientType, smallBusiness);
  const vatRate: VatRate = zeroVat ? 0 : vatChoice;
  const note = taxNote(clientType, smallBusiness);
  const suggestedNumber = useMemo(() => (profile ? nextInvoiceNumber() : ""), [profile]);
  const token = tokenFor(currency);

  const net = parseEuroInput(amount);
  const gross = useMemo(() => (net ? grossFromNet(net, vatRate) : null), [net, vatRate]);

  if (profile && !profile.wallet) {
    return (
      <Shell>
        <div className="card p-8 text-center">
          <h1 className="mb-2 text-xl font-bold">First, tell us where to send your money</h1>
          <p className="mb-5 text-sm text-muted">Add your name and Solana wallet once — then invoicing takes 20 seconds.</p>
          <Link href="/settings" className="btn-primary">
            Set up my business
          </Link>
        </div>
      </Shell>
    );
  }

  function pickClientType(t: ClientType) {
    setClientType(t);
    // Sensible default: US/UK/CH clients usually hold dollars, EU/German clients euros.
    setCurrency(t === "intl" ? "USD" : "EUR");
  }

  function onCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!clientName.trim()) return setError("Who is the client?");
    if (clientType === "eu" && !clientVatId.trim())
      return setError("For EU reverse charge, the client's VAT ID (USt-IdNr.) is required.");
    if (!description.trim()) return setError("What is this invoice for?");
    if (!net || !gross) return setError("Please enter a valid amount, e.g. 1.200,00");
    const reference = Keypair.generate().publicKey.toBase58();
    const inv: Invoice = {
      id: reference,
      number: number.trim() || suggestedNumber || nextInvoiceNumber(),
      issueDate: localDate(),
      dueDate,
      currency,
      clientType,
      clientVatId: clientType === "eu" ? clientVatId.trim() : "",
      clientName: clientName.trim(),
      clientEmail: clientEmail.trim(),
      description: description.trim(),
      net,
      vatRate,
      gross,
      reference,
      status: "open",
    };
    upsertInvoice(inv);
    router.push(`/invoice?id=${reference}`);
  }

  return (
    <Shell>
      <h1 className="mb-6 text-2xl font-bold">New invoice</h1>
      <form onSubmit={onCreate} className="card space-y-5 p-6">
        <div>
          <label className="label">Where is your client?</label>
          <div className="grid gap-2 sm:grid-cols-3">
            {CLIENT_TYPES.map((t) => (
              <button
                type="button"
                key={t.value}
                onClick={() => pickClientType(t.value)}
                className={`rounded-xl border p-3 text-left text-sm transition ${
                  clientType === t.value ? "border-accent bg-accent-soft" : "border-line bg-white hover:bg-paper"
                }`}
              >
                <span className="block font-semibold">{t.label}</span>
                <span className="block text-xs text-muted">{t.hint}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Client</label>
            <input
              className="input"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Acme Labs Inc."
            />
          </div>
          {clientType === "eu" ? (
            <div>
              <label className="label">Client VAT ID (USt-IdNr.)</label>
              <input
                className="input"
                value={clientVatId}
                onChange={(e) => setClientVatId(e.target.value)}
                placeholder="FR12345678901"
              />
            </div>
          ) : (
            <div>
              <label className="label">Client email (optional)</label>
              <input
                type="email"
                className="input"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                placeholder="billing@acme.com"
              />
            </div>
          )}
        </div>

        <div>
          <label className="label">Service</label>
          <input
            className="input"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Landing page design, September 2026"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="label">Net amount</label>
            <input
              className="input"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="2.000,00"
            />
          </div>
          <div>
            <label className="label">Currency</label>
            <select className="input" value={currency} onChange={(e) => setCurrency(e.target.value as Currency)}>
              <option value="USD">USD — paid in USDC</option>
              <option value="EUR">EUR — paid in EURC</option>
            </select>
          </div>
          <div>
            <label className="label">VAT</label>
            <select
              className="input"
              value={vatRate}
              onChange={(e) => setVatRate(Number(e.target.value) as VatRate)}
              disabled={zeroVat}
            >
              <option value={19}>19 %</option>
              <option value={7}>7 %</option>
              <option value={0}>0 %</option>
            </select>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Invoice number</label>
            <input className="input" value={number} onChange={(e) => setNumber(e.target.value)} placeholder={suggestedNumber} />
          </div>
          <div>
            <label className="label">Due date</label>
            <input type="date" className="input" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>
        </div>

        {gross && net && (
          <div className="rounded-xl bg-paper p-4 text-sm">
            <div className="flex justify-between text-muted">
              <span>Net</span>
              <span>{formatMoney(net, currency)}</span>
            </div>
            <div className="flex justify-between text-muted">
              <span>VAT {vatRate} %</span>
              <span>{formatMoney(vatAmount(net, gross), currency)}</span>
            </div>
            <div className="mt-2 flex justify-between border-t border-line pt-2 text-base font-bold">
              <span>Client pays</span>
              <span>
                {formatMoney(gross, currency)} <span className="text-xs font-semibold text-muted">in {token.symbol}</span>
              </span>
            </div>
            {note && <p className="mt-3 text-xs text-muted">Invoice note: „{note}“</p>}
          </div>
        )}
        {error && <p className="rounded-xl bg-warn-soft px-3 py-2 text-sm text-warn">{error}</p>}
        <button className="btn-primary w-full">Create invoice & payment QR</button>
      </form>
    </Shell>
  );
}
