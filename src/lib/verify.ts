import { Connection, PublicKey, type ParsedTransactionWithMeta } from "@solana/web3.js";
import { toBaseUnits, fromBaseUnits } from "./money";

export type PaymentCheck =
  | { state: "none" }
  | {
      state: "paid" | "underpaid";
      signature: string;
      paidAt: string | null; // ISO
      payer: string | null;
      received: string; // decimal EUR
    };

/**
 * Pure function: how much of `mint` did `recipient` receive in this transaction?
 * Uses the token balance changes recorded by the network, so it works no matter
 * which wallet or instruction layout the payer used.
 */
export function receivedInTx(
  tx: Pick<ParsedTransactionWithMeta, "meta">,
  recipient: string,
  mint: string,
): { units: bigint; decimals: number } {
  const meta = tx.meta;
  if (!meta || meta.err) return { units: BigInt(0), decimals: 6 };
  const sum = (list: typeof meta.preTokenBalances) => {
    let total = BigInt(0);
    let decimals = 6;
    for (const b of list ?? []) {
      if (b.mint === mint && b.owner === recipient) {
        total += BigInt(b.uiTokenAmount.amount);
        decimals = b.uiTokenAmount.decimals;
      }
    }
    return { total, decimals };
  };
  const pre = sum(meta.preTokenBalances);
  const post = sum(meta.postTokenBalances);
  return { units: post.total - pre.total, decimals: post.decimals };
}

/** Pure function: evaluate one transaction against the invoice. */
export function evaluateTx(
  tx: ParsedTransactionWithMeta,
  signature: string,
  opts: { recipient: string; mint: string; expected: string },
): PaymentCheck {
  const { units, decimals } = receivedInTx(tx, opts.recipient, opts.mint);
  if (units <= BigInt(0)) return { state: "none" };
  const expectedUnits = toBaseUnits(opts.expected, decimals);
  const firstKey = tx.transaction?.message?.accountKeys?.[0];
  const payer = firstKey ? firstKey.pubkey.toBase58() : null;
  return {
    state: units >= expectedUnits ? "paid" : "underpaid",
    signature,
    paidAt: tx.blockTime ? new Date(tx.blockTime * 1000).toISOString() : null,
    payer,
    received: fromBaseUnits(units, decimals),
  };
}

/**
 * Looks up every transaction that carries this invoice's reference key and
 * checks whether the recipient received the expected EURC amount.
 */
export async function checkPayment(
  connection: Connection,
  opts: { reference: string; recipient: string; mint: string; expected: string },
): Promise<PaymentCheck> {
  const sigs = await connection.getSignaturesForAddress(new PublicKey(opts.reference), { limit: 20 }, "confirmed");
  let best: PaymentCheck = { state: "none" };
  // Oldest first, so the first valid payment wins.
  for (const s of [...sigs].reverse()) {
    if (s.err) continue;
    const tx = await connection.getParsedTransaction(s.signature, {
      commitment: "confirmed",
      maxSupportedTransactionVersion: 0,
    });
    if (!tx) continue;
    const result = evaluateTx(tx, s.signature, opts);
    if (result.state === "paid") return result;
    if (result.state === "underpaid" && best.state === "none") best = result;
  }
  return best;
}
