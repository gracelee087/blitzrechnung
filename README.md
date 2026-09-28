# ⚡ Blitzrechnung — get paid by foreign clients in seconds

**Invoices for German freelancers, paid in stablecoins on Solana — with German tax notes and a DATEV-style export built in.**

Built for the *Build an MVP with Solana at WHU* hackathon (Superteam Germany, 2026).

- 🎬 Demo video: [demo.mp4](demo.mp4)
- Live app (Solana devnet, test money): https://blitzrechnung-one.vercel.app
- Pitch deck (PDF): [pitch-deck.pdf](pitch-deck.pdf)
- Builder: Sohee Lee · X [@ChachaL10757287](https://x.com/ChachaL10757287)

## The problem

About one in four German freelancers was working for clients based outside Germany [1].
Inside the eurozone, SEPA Instant already solved speed [5]. Outside it (US, UK, CH), getting paid costs fees, and German paperwork follows:

- PayPal Checkout charges a German business **2.99 % + €0.39**, plus **1.99 %** for payments from outside the EEA — about **$75 on a $1,500 invoice**, before the fixed fee and any currency conversion [2].
- **12 % of freelancers' working time is not billable**, and bureaucracy (tax returns, bookkeeping) is the main reason [3].

## The solution

1. **Create an invoice in one short form.** Choose where the client is (Germany / EU business / outside the EU), and the matching VAT treatment and invoice note are added automatically:
   - reverse charge (*Steuerschuldnerschaft des Leistungsempfängers*)
   - *Nicht im Inland steuerbare Leistung*
   - § 19 UStG for Kleinunternehmer
2. **The client scans a QR code** (Solana Pay) and pays in **USDC** (USD invoices) or **EURC** (EUR invoices). Circle issues both under the EU's MiCA rules [4].
3. **The invoice turns *Paid* automatically, seconds after payment.** On our first devnet test payment: 3.1 s from the Solana block to *Paid* in the app, network fee 0.00008 SOL.
4. **One click exports a simplified DATEV-style booking list** for the Steuerberater to review, with the revenue account per client type and the Solana transaction ID.

## Why Solana

- **Fast and cheap enough for invoices:** our test payment was confirmed in seconds with a 0.00008 SOL network fee, and the network runs 24/7, including weekends.
- **Solana Pay:** a standard QR/link format that works with Phantom, Solflare and other wallets [6].
- **Reference keys:** every invoice gets a unique key that is attached to the payment transaction, so the app matches payments to invoices on-chain, with no bank reconciliation [6].
- **Regulated stablecoins live on Solana:** EURC and USDC, both issued by Circle [4].

## How it works (technical)

| Part | File |
|---|---|
| Solana Pay transfer-request URL (`solana:<wallet>?amount=…&spl-token=…&reference=…`) | `src/lib/solanaPay.ts` |
| Finding and verifying the payment: `getSignaturesForAddress(reference)` → check the recipient's token balance change | `src/lib/verify.ts` |
| Desktop "Pay with browser wallet" (the wallet signs; the app sends through its own RPC) | `src/lib/walletPay.ts` |
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

- **E-Rechnung:** ZUGFeRD / XRechnung output for German domestic B2B.
- **Full DATEV EXTF import header.** Today the export is a simplified Buchungsstapel CSV.
- **Automatic EUR value for USD invoices,** using the rate of the payment day.
- **Fiat on-ramp** for clients who don't hold stablecoins yet, and **off-ramp** to the freelancer's bank account.
- **Accounts and cloud sync** instead of browser-only storage.

> ⚠️ Not tax advice. The VAT notes and SKR03 accounts are sensible defaults; confirm them with your Steuerberater.

## References

1. freelance.de, *So arbeiten Freelancer in Deutschland* (2024, n = 1,615). https://www.freelance.de/blog/internationalisierung-neue-studie-untersucht-globale-chancen-und-herausforderungen-fuer-freelancer/
2. PayPal Germany, business fees (checked 28 Sep 2026). https://www.paypal.com/de/business/paypal-business-fees
3. freelancermap, *Freelancer-Kompass 2026*, via Gründerküche. https://www.gruenderkueche.de/news/gruender-news/jede-achte-arbeitsstunde-unbezahlt-buerokratie-kostet-freelancer-zeit-und-umsatz/
4. Circle, *Circle is first global stablecoin issuer to comply with MiCA* (1 July 2024). https://www.circle.com/pressroom/circle-is-first-global-stablecoin-issuer-to-comply-with-mica-eus-landmark-crypto-law
5. European Central Bank, *Instant Payments Regulation*. https://www.ecb.europa.eu/paym/retail/instant_payments/html/instant_payments_regulation.en.html
6. Solana Pay specification. https://docs.solanapay.com/spec
