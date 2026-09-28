import Link from "next/link";
import { CLUSTER } from "@/lib/config";

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 font-bold tracking-tight">
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent text-white">
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
          <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z" />
        </svg>
      </span>
      Blitzrechnung
    </Link>
  );
}

export function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:py-10">
      <header className="no-print mb-8 flex flex-wrap items-center justify-between gap-3">
        <Logo />
        <nav className="flex items-center gap-2 text-sm">
          {CLUSTER === "devnet" && (
            <span className="rounded-full bg-warn-soft px-2.5 py-1 text-xs font-semibold text-warn">Devnet · test money</span>
          )}
          <Link href="/settings" className="btn-ghost">
            Settings
          </Link>
          <Link href="/new" className="btn-primary">
            + New invoice
          </Link>
        </nav>
      </header>
      {children}
    </div>
  );
}
