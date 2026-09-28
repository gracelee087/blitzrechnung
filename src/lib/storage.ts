"use client";
import { useSyncExternalStore } from "react";
import type { Invoice, Profile } from "./types";

// MVP storage: the freelancer's own browser. Nothing is sent to a server.
const PROFILE_KEY = "blitz.profile.v1";
const INVOICES_KEY = "blitz.invoices.v1";

export const DEFAULT_PROFILE: Profile = {
  name: "",
  address: "",
  taxId: "",
  wallet: "",
  smallBusiness: false,
  datevCashAccount: "1360", // SKR03 "Geldtransit" — placeholder, ask your Steuerberater
  datevRevenueAccount: "8400", // SKR03 Erlöse 19 % USt
  datevRevenueAccountEU: "8336", // SKR03 Erlöse EU sonstige Leistungen (Reverse Charge) — confirm
  datevRevenueAccountIntl: "8338", // SKR03 Erlöse Drittland, nicht steuerbar — confirm
};

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable (private mode) — app still works for this session */
  }
  notifyStorage();
}

export const loadProfile = (): Profile => ({ ...DEFAULT_PROFILE, ...read<Partial<Profile>>(PROFILE_KEY, {}) });
export const saveProfile = (p: Profile) => write(PROFILE_KEY, p);

// Older invoices (before USD / client types existed) get safe defaults.
export const loadInvoices = (): Invoice[] =>
  read<Partial<Invoice>[]>(INVOICES_KEY, []).map(
    (i) => ({ currency: "EUR", clientType: "de", clientVatId: "", ...i }) as Invoice,
  );
export const saveInvoices = (list: Invoice[]) => write(INVOICES_KEY, list);

export function upsertInvoice(inv: Invoice) {
  const list = loadInvoices();
  const i = list.findIndex((x) => x.id === inv.id);
  if (i >= 0) list[i] = inv;
  else list.unshift(inv);
  saveInvoices(list);
}

export function nextInvoiceNumber(): string {
  const year = new Date().getFullYear();
  const prefix = `RE-${year}-`;
  const max = loadInvoices()
    .map((x) => x.number)
    .filter((n) => n.startsWith(prefix))
    .map((n) => parseInt(n.slice(prefix.length), 10) || 0)
    .reduce((a, b) => Math.max(a, b), 0);
  return `${prefix}${String(max + 1).padStart(3, "0")}`;
}

// ---- React hooks: read storage without setState-in-effect, and re-render on every write ----

const listeners = new Set<() => void>();
function subscribe(cb: () => void) {
  listeners.add(cb);
  window.addEventListener("storage", cb);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", cb);
  };
}
export function notifyStorage() {
  listeners.forEach((l) => l());
}

const snapshotCache = new Map<string, { raw: string | null; value: unknown }>();
function snapshot<T>(key: string, parse: () => T): T {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(key);
  } catch {
    /* ignore */
  }
  const hit = snapshotCache.get(key);
  if (hit && hit.raw === raw) return hit.value as T;
  const value = parse();
  snapshotCache.set(key, { raw, value });
  return value;
}

/** null during server render, then the stored profile. */
export function useProfile(): Profile | null {
  return useSyncExternalStore(
    subscribe,
    () => snapshot(PROFILE_KEY, loadProfile),
    () => null,
  );
}

/** null during server render, then the stored invoices. */
export function useInvoices(): Invoice[] | null {
  return useSyncExternalStore(
    subscribe,
    () => snapshot(INVOICES_KEY, loadInvoices),
    () => null,
  );
}
