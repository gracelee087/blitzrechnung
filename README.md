# ⚡ Blitzrechnung — get paid by foreign clients in seconds

**Invoices for German freelancers, paid instantly in stablecoins on Solana — with German tax notes and a DATEV export built in.**

Built for the *Build an MVP with Solana at WHU* hackathon (Superteam Germany, 2026).

## The problem

About 25 % of German freelancers work for clients abroad ([freelance.de, 2024](https://www.freelance.de/blog/internationalisierung-neue-studie-untersucht-globale-chancen-und-herausforderungen-fuer-freelancer/)).
Inside the eurozone, SEPA Instant already solved speed. Outside it (US, UK, CH), getting paid is still slow and expensive:

- A US client paying a €2,000 invoice via PayPal costs the freelancer roughly **5–8 %** once cross-border and conversion fees are added ([PayPal DE fees](https://www.paypal.com/de/business/paypal-business-fees)).
- A SWIFT wire from outside the EEA can take **about a week, up to 14 days**, plus bank fees.
- German freelancers lose **12 % of their working hours** to admin work, and bookkeeping is one of the most burdensome tasks ([Freelancer-Kompass 2026](https://www.gruenderkueche.de/news/gruender-news/jede-achte-arbeitsstunde-unbezahlt-buerokratie-kostet-freelancer-zeit-und-umsatz/)).

## The solution

1. **Create an invoice in 20 seconds.** Choose where the client is (Germany / EU business / outside the EU), and the correct VAT treatment and legally required note are added automatically:
   - reverse charge (*Steuerschuldnerschaft des Leistungsempfängers*)
   - *Nicht im Inland steuerbare Leistung*
   - § 19 UStG for Kleinunternehmer
2. **The client scans a QR code** (Solana Pay) and pays in **USDC** (USD invoices) or **EURC** (EUR invoices, MiCA-regulated).
3. **The money arrives in about a second** with near-zero network fees. The invoice turns *Paid* automatically.
4. **One click exports a DATEV booking list** for the Steuerberater, with the right revenue account per client type.

## Why Solana

- **Fast and cheap enough for invoices:** sub-second settlement and fees below one cent, 24/7, including weekends. Card rails and SWIFT cannot match this.
- **Solana Pay:** a standard QR/link format that works with Phantom, Solflare and other wallets out of the box.
- **Reference keys:** every invoice gets a unique key that is attached to the payment transaction, so the app matches payments to invoices on-chain, with no bank reconciliation.
- **Regulated stablecoins live on Solana:** EURC and USDC, both issued by Circle.

## How it works (technical)

| Part | File |
|---|---|
| Solana Pay transfer-request URL (`solana:<wallet>?amount=…&spl-token=…&reference=…`) | `src/lib/solanaPay.ts` |
| Finding and verifying the payment: `getSignaturesForAddress(reference)` → check the recipient's token balance change | `src/lib/verify.ts` |
| Desktop "Pay with browser wallet" (same transfer, reference key attached) | `src/lib/walletPay.ts` |
| German tax notes and DATEV accounts | `src/lib/tax.ts`, `src/lib/datev.ts` |
| Invoices stored in the freelancer's browser; payment link carries the invoice | `src/lib/storage.ts`, `src/lib/share.ts` |

There is no backend database: **the blockchain is the source of truth for payment status.**

## Run it locally

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # logic tests
```

The app runs on **Solana devnet** (test money) by default. To try a full payment:

1. Install [Phantom](https://phantom.com/) and switch it to *Testnet mode → Solana Devnet*.
2. Get devnet SOL from [faucet.solana.com](https://faucet.solana.com/) and devnet USDC/EURC from [faucet.circle.com](https://faucet.circle.com/).
3. In the app, open **Settings** and paste a *receiving* wallet address.
4. Create an invoice and open the payment link. Pay with a *second* wallet, either by scanning the QR code with Phantom mobile or with **Pay with browser wallet**.

Configuration (optional, `.env.local`): see `.env.example`.

## Roadmap

- **E-Rechnung:** ZUGFeRD / XRechnung output. This becomes mandatory for German domestic B2B from 2027/2028.
- **Full DATEV EXTF import header.** Today the export is a simplified Buchungsstapel CSV.
- **Automatic EUR rate for USD invoices,** using the rate of the payment day.
- **Fiat on-ramp** for clients who don't hold stablecoins yet, and **off-ramp** to the freelancer's bank account.
- **Accounts and cloud sync** instead of browser-only storage.

> ⚠️ Not tax advice. The VAT notes and SKR03 accounts are sensible defaults; confirm them with your Steuerberater.
