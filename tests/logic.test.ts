import { test } from "node:test";
import assert from "node:assert/strict";
import { Keypair, PublicKey, type ParsedTransactionWithMeta } from "@solana/web3.js";
import { parseEuroInput, grossFromNet, toBaseUnits, fromBaseUnits, datevAmount } from "../src/lib/money";
import { buildTransferUrl } from "../src/lib/solanaPay";
import { encodeShared, decodeShared } from "../src/lib/share";
import { evaluateTx, receivedInTx } from "../src/lib/verify";
import { buildDatevCsv, datevDate } from "../src/lib/datev";
import type { Invoice, Profile, SharedInvoice } from "../src/lib/types";

const MINT = "HzwqbKZw8HxMN6bF2yFZNrht3c2iXXzpKcFu7uBEDKtr";

test("parseEuroInput handles German and English formats", () => {
  assert.equal(parseEuroInput("1.000,50"), "1000.50");
  assert.equal(parseEuroInput("1000,5"), "1000.50");
  assert.equal(parseEuroInput("1000.5"), "1000.50");
  assert.equal(parseEuroInput("  250 € "), "250.00");
  assert.equal(parseEuroInput("0"), null);
  assert.equal(parseEuroInput("abc"), null);
  assert.equal(parseEuroInput("1.2.3"), null);
});

test("VAT and base units", () => {
  assert.equal(grossFromNet("1000.00", 19), "1190.00");
  assert.equal(grossFromNet("99.99", 7), "106.99");
  assert.equal(grossFromNet("500.00", 0), "500.00");
  assert.equal(toBaseUnits("119.00", 6), BigInt(119000000));
  assert.equal(fromBaseUnits(BigInt(119000000), 6), "119.00");
  assert.equal(datevAmount("1190"), "1190,00");
});

test("Solana Pay URL follows the transfer-request spec", () => {
  const ref = Keypair.generate().publicKey.toBase58();
  const recipient = Keypair.generate().publicKey.toBase58();
  const url = buildTransferUrl({ recipient, amount: "119.00", reference: ref, label: "Anna Müller", message: "Rechnung RE-2026-001", memo: "RE-2026-001", mint: MINT });
  assert.ok(url.startsWith(`solana:${recipient}?`));
  const params = new URLSearchParams(url.split("?")[1]);
  assert.equal(params.get("amount"), "119.00");
  assert.equal(params.get("spl-token"), MINT);
  assert.equal(params.get("reference"), ref);
  assert.equal(params.get("label"), "Anna Müller");
  assert.ok(!url.includes("+"), "spaces must be %20, not +");
});

test("share link round-trips including umlauts", () => {
  const s: SharedInvoice = {
    v: 1, number: "RE-2026-001", currency: "EUR", clientType: "eu", clientVatId: "FR123", issueDate: "2026-09-28", dueDate: "2026-10-12",
    clientName: "Größe & Co. KG", description: "Webdesign – Landingpage", net: "100.00", vatRate: 19, gross: "119.00",
    reference: Keypair.generate().publicKey.toBase58(),
    issuer: { name: "Jürgen", address: "Berliner Str. 1", taxId: "", wallet: Keypair.generate().publicKey.toBase58(), smallBusiness: false },
  };
  assert.deepEqual(decodeShared(encodeShared(s)), s);
  assert.equal(decodeShared("garbage"), null);
});

// Fake parsed transaction with token balance changes
function fakeTx(recipient: string, preUnits: string | null, postUnits: string, opts: { err?: boolean; mint?: string } = {}) {
  const payer = Keypair.generate().publicKey;
  const mint = opts.mint ?? MINT;
  const bal = (amount: string) => ({ accountIndex: 1, mint, owner: recipient, uiTokenAmount: { amount, decimals: 6, uiAmount: null, uiAmountString: "" } });
  return {
    blockTime: 1790000000,
    meta: {
      err: opts.err ? { InstructionError: [0, "Custom"] } : null,
      preTokenBalances: preUnits === null ? [] : [bal(preUnits)],
      postTokenBalances: [bal(postUnits)],
    },
    transaction: { message: { accountKeys: [{ pubkey: payer }] } },
    payer,
  } as unknown as ParsedTransactionWithMeta & { payer: PublicKey };
}

test("detects full payment, including when recipient token account is new", () => {
  const recipient = Keypair.generate().publicKey.toBase58();
  const tx = fakeTx(recipient, null, "119000000");
  const r = evaluateTx(tx, "sig1", { recipient, mint: MINT, expected: "119.00" });
  assert.equal(r.state, "paid");
  if (r.state === "paid") {
    assert.equal(r.received, "119.00");
    assert.equal(r.payer, tx.payer.toBase58());
    assert.equal(r.paidAt, new Date(1790000000 * 1000).toISOString());
  }
});

test("detects underpayment, ignores failed tx, other mints and other recipients", () => {
  const recipient = Keypair.generate().publicKey.toBase58();
  assert.equal(evaluateTx(fakeTx(recipient, "5000000", "105000000"), "s", { recipient, mint: MINT, expected: "119.00" }).state, "underpaid");
  assert.equal(evaluateTx(fakeTx(recipient, null, "119000000", { err: true }), "s", { recipient, mint: MINT, expected: "119.00" }).state, "none");
  assert.equal(evaluateTx(fakeTx(recipient, null, "119000000", { mint: "So11111111111111111111111111111111111111112" }), "s", { recipient, mint: MINT, expected: "119.00" }).state, "none");
  const other = Keypair.generate().publicKey.toBase58();
  assert.equal(receivedInTx(fakeTx(other, null, "119000000"), recipient, MINT).units, BigInt(0));
});

test("DATEV CSV contains only paid invoices in German format", () => {
  const profile: Profile = { name: "A", address: "", taxId: "", wallet: "w", smallBusiness: false, datevCashAccount: "1360", datevRevenueAccount: "8400", datevRevenueAccountEU: "8336", datevRevenueAccountIntl: "8338" };
  const base = { currency: "EUR" as const, clientType: "de" as const, clientVatId: "", issueDate: "2026-09-28", dueDate: "2026-10-12", clientEmail: "", description: "x", net: "1000.00", vatRate: 19 as const, gross: "1190.00", reference: "r" };
  const invoices: Invoice[] = [
    { ...base, id: "1", number: "RE-2026-001", clientName: 'Kunde "Eins"', status: "paid", paidAt: "2026-10-01T10:00:00.000Z", signature: "SIG" },
    { ...base, id: "2", number: "RE-2026-002", clientName: "Kunde Zwei", status: "open" },
    { ...base, id: "3", number: "RE-2026-003", clientName: "Acme Inc", currency: "USD", clientType: "intl", vatRate: 0, gross: "2000.00", status: "paid", paidAt: "2026-10-02T09:00:00.000Z", signature: "SIG2" },
  ];
  const csv = buildDatevCsv(invoices, profile);
  const lines = csv.trim().split("\r\n");
  assert.equal(lines.length, 3);
  assert.ok(lines[2].startsWith('2000,00;S;USD;1360;8338;;0210;"RE-2026-003";'));
  assert.ok(lines[2].includes("USDC"));
  assert.ok(lines[1].startsWith('1190,00;S;EUR;1360;8400;;0110;"RE-2026-001";'));
  assert.ok(lines[1].includes('Kunde ""Eins""'));
  assert.equal(datevDate("2026-12-05"), "0512");
});

test("checkPayment finds the paying transaction via the reference key", async () => {
  const { checkPayment } = await import("../src/lib/verify");
  const recipient = Keypair.generate().publicKey.toBase58();
  const reference = Keypair.generate().publicKey.toBase58();
  const txs: Record<string, unknown> = {
    failed: fakeTx(recipient, null, "119000000", { err: true }),
    partial: fakeTx(recipient, null, "50000000"),
    full: fakeTx(recipient, "50000000", "169000000"),
  };
  const fakeConnection = {
    // newest first, like the real RPC
    getSignaturesForAddress: async (addr: PublicKey) => {
      assert.equal(addr.toBase58(), reference);
      return [{ signature: "full", err: null }, { signature: "partial", err: null }, { signature: "failed", err: { x: 1 } }];
    },
    getParsedTransaction: async (sig: string) => txs[sig],
  } as unknown as import("@solana/web3.js").Connection;
  const r = await checkPayment(fakeConnection, { reference, recipient, mint: MINT, expected: "119.00" });
  assert.equal(r.state, "paid");
  if (r.state === "paid") assert.equal(r.signature, "full");

  const none = await checkPayment(
    { getSignaturesForAddress: async () => [], getParsedTransaction: async () => null } as unknown as import("@solana/web3.js").Connection,
    { reference, recipient, mint: MINT, expected: "119.00" },
  );
  assert.equal(none.state, "none");
});

test("German tax notes per client type", async () => {
  const { taxNote, isZeroVat, revenueAccountFor } = await import("../src/lib/tax");
  assert.equal(taxNote("de", false), null);
  assert.match(taxNote("de", true)!, /§ 19 UStG/);
  assert.match(taxNote("eu", false)!, /Steuerschuldnerschaft des Leistungsempfängers/);
  assert.match(taxNote("intl", false)!, /Nicht im Inland steuerbare Leistung/);
  assert.equal(isZeroVat("de", false), false);
  assert.equal(isZeroVat("intl", false), true);
  assert.equal(isZeroVat("de", true), true);
  const prof = { datevRevenueAccount: "8400", datevRevenueAccountEU: "8336", datevRevenueAccountIntl: "8338" } as Profile;
  assert.equal(revenueAccountFor("eu", prof), "8336");
});

test("USDC mint is used for USD invoices", async () => {
  const { tokenFor } = await import("../src/lib/config");
  assert.equal(tokenFor("EUR").symbol, "EURC");
  assert.equal(tokenFor("USD").symbol, "USDC");
  assert.equal(tokenFor("USD").mint, "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU");
});
