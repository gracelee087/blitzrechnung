/**
 * Builds a Solana Pay "transfer request" URL.
 * Spec: https://docs.solanapay.com/spec
 *   solana:<recipient>?amount=<decimal>&spl-token=<mint>&reference=<pubkey>&label=..&message=..&memo=..
 * Any Solana Pay wallet (Phantom, Solflare, …) can scan this as a QR code.
 * The `reference` is a random public key that is attached to the payment
 * transaction, so we can find exactly this invoice's payment on-chain later.
 */
export function buildTransferUrl(params: {
  recipient: string;
  amount: string; // decimal string, e.g. "119.00"
  reference: string;
  label: string;
  message: string;
  memo?: string;
  mint: string; // EURC or USDC mint
}): string {
  const q = new URLSearchParams();
  q.set("amount", params.amount);
  q.set("spl-token", params.mint);
  q.set("reference", params.reference);
  q.set("label", params.label);
  q.set("message", params.message);
  if (params.memo) q.set("memo", params.memo);
  // URLSearchParams encodes spaces as "+"; the Solana Pay spec expects %20.
  return `solana:${params.recipient}?${q.toString().replace(/\+/g, "%20")}`;
}
