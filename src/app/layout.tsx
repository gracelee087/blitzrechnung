import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Blitzrechnung — get paid in seconds",
  description: "E-invoices for German freelancers, paid instantly in EURC on Solana.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
