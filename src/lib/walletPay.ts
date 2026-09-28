import { Connection, PublicKey, Transaction } from "@solana/web3.js";
import {
  createAssociatedTokenAccountIdempotentInstruction,
  createTransferCheckedInstruction,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";

import { toBaseUnits } from "./money";

// Minimal type for the wallet that Phantom / Solflare inject into the browser.
interface InjectedWallet {
  publicKey?: PublicKey | null;
  connect: () => Promise<{ publicKey: PublicKey }>;
  signAndSendTransaction: (tx: Transaction) => Promise<{ signature: string }>;
}

export function getInjectedWallet(): InjectedWallet | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    phantom?: { solana?: InjectedWallet };
    solflare?: InjectedWallet;
    solana?: InjectedWallet;
  };
  return w.phantom?.solana ?? w.solflare ?? w.solana ?? null;
}

/**
 * Desktop fallback for Solana Pay: builds the same EURC transfer a mobile wallet
 * would build from the QR code (including the reference key) and asks the
 * browser wallet to sign and send it.
 */
export async function payWithBrowserWallet(
  connection: Connection,
  params: { recipient: string; amount: string; reference: string; mint: string; decimals: number },
): Promise<string> {
  const wallet = getInjectedWallet();
  if (!wallet) throw new Error("No Solana wallet found in this browser. Install Phantom, or scan the QR code with your phone.");
  const { publicKey: payer } = await wallet.connect();

  const mint = new PublicKey(params.mint);
  const recipient = new PublicKey(params.recipient);
  const fromAta = getAssociatedTokenAddressSync(mint, payer);
  const toAta = getAssociatedTokenAddressSync(mint, recipient);

  const transfer = createTransferCheckedInstruction(
    fromAta,
    mint,
    toAta,
    payer,
    toBaseUnits(params.amount, params.decimals),
    params.decimals,
  );
  // Solana Pay convention: add the reference as a read-only, non-signer key.
  transfer.keys.push({ pubkey: new PublicKey(params.reference), isSigner: false, isWritable: false });

  const tx = new Transaction().add(
    // Creates the recipient's token account if it does not exist yet (no-op otherwise).
    createAssociatedTokenAccountIdempotentInstruction(payer, toAta, recipient, mint),
    transfer,
  );
  tx.feePayer = payer;
  tx.recentBlockhash = (await connection.getLatestBlockhash("confirmed")).blockhash;

  const { signature } = await wallet.signAndSendTransaction(tx);
  return signature;
}
