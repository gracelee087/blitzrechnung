"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Connection } from "@solana/web3.js";
import { RPC_URL } from "@/lib/config";
import { checkPayment, type PaymentCheck } from "@/lib/verify";

/** Polls the chain for this invoice's payment until it is paid. */
export function usePayment(
  params: { reference: string; recipient: string; expected: string; mint: string } | null,
  intervalMs = 4000,
) {
  const connection = useMemo(() => new Connection(RPC_URL, "confirmed"), []);
  const [result, setResult] = useState<PaymentCheck>({ state: "none" });
  const [error, setError] = useState<string>("");
  const busy = useRef(false);

  const check = useCallback(async () => {
    if (!params || busy.current) return;
    busy.current = true;
    try {
      const r = await checkPayment(connection, params);
      setResult(r);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not reach the Solana network");
    } finally {
      busy.current = false;
    }
  }, [connection, params]);

  useEffect(() => {
    if (!params) return;
    const first = setTimeout(check, 0);
    if (result.state === "paid") return () => clearTimeout(first);
    const t = setInterval(check, intervalMs);
    return () => {
      clearTimeout(first);
      clearInterval(t);
    };
  }, [params, check, intervalMs, result.state]);

  return { result, error, check, connection };
}
