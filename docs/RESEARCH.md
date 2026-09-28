# Research notes for the pitch (as of Sept 2026)

These are the numbers that are safe to put on slides, each with its source. Items flagged ⚠️ are vendor claims or estimates; say so if you use them.

## Problem: foreign clients are slow and expensive

**Inside the eurozone, speed is already solved.** Banks have had to send instant SEPA payments at no extra charge since 9 Oct 2025.
- Source: ECB, Instant Payments Regulation — https://www.ecb.europa.eu/paym/retail/instant_payments/html/instant_payments_regulation.en.html

**PayPal (German merchant account):**
- Base fee: 2.99% + €0.39
- Surcharge for non-EEA senders: +1.99%
- Currency conversion: about 3%
- ⚠️ Our own calculation from these fees: about 5–8% of a €2,000 US invoice.
- Source: https://www.paypal.com/de/business/paypal-business-fees

**Stripe (Germany):**
- International cards: 3.15% + €0.25
- Currency conversion: +2%
- Source: https://stripe.com/en-DE/pricing

**SWIFT from outside the EEA:**
- About a week, up to 14 days, plus about €12.50–20 in bank fees.
- ⚠️ This comes via Wise, which is a competitor: https://wise.com/en-de/blog/sparkasse-international-transfer

## Problem: admin time

- German freelancers spend **12% of working hours** on unpaid admin work. The most burdensome tasks are tax returns (52%) and bookkeeping (42%).
  - Source: Freelancer-Kompass 2026 (n ≈ 5,400) — https://www.gruenderkueche.de/news/gruender-news/jede-achte-arbeitsstunde-unbezahlt-buerokratie-kostet-freelancer-zeit-und-umsatz/
- DATEV is the standard for tax advisors. It has 40,000+ member tax advisors and 1M+ customers.
  - Source: https://www.datev.de/web/de/berufsgruppenuebergreifend/ueber-datev/das-unternehmen/unternehmensprofil

## Market (Germany)

- **Solo self-employed:** about 1.8M (2024).
  - Source: IfM Bonn — https://www.ifm-bonn.org/en/statistics/self-employment-freelancers-in-the-liberal-professions/self-employment
- **Freelancers with foreign clients:**
  - About 25% of German freelancers have worked for foreign clients, and 10% work only for international clients.
  - Source: freelance.de, 2024 (n = 1,615) — https://www.freelance.de/blog/internationalisierung-neue-studie-untersucht-globale-chancen-und-herausforderungen-fuer-freelancer/
- ⚠️ **Our own estimate:** about 450,000 solo self-employed with foreign clients.

## Competition

No tool was found that combines German-compliant invoices, stablecoin payment and a DATEV export.

| Tool | German invoices / E-Rechnung | DATEV | Stablecoin payments | Fees |
|---|---|---|---|---|
| sevdesk, Lexware Office, Qonto, Finom | ✅ | ✅ | ❌ | Monthly plan |
| MoonPay Commerce (ex-Helio) | ❌ | ❌ (CSV only) | ✅ | 2% (1% premium) |
| Request Finance | ❌ | not found | ✅ | from $50/month |

## Risks, stated honestly

**Client adoption is the biggest risk.**
- Only 2% of German companies use crypto today.
  - Source: Bitkom 2025 — https://www.bitkom.org/Presse/Presseinformation/Unternehmen-sehen-Zukunft-Kryptowaehrungen-zoegern-bei-Nutzung
- EURC circulation is about €404M.
  - Source: https://www.circle.com/eurc
- → **Start with crypto-native clients** (web3 startups, US tech companies). Add a card on-ramp later.

**Tax treatment:**
- Stablecoin income is business income at the day's value.
- The records must be GoBD-compliant (the German rules for digital bookkeeping records).
- → Confirm with a Steuerberater. The DATEV export and the transaction links help here.

**E-Rechnung:**
- The mandate applies to **domestic** B2B only (from 2027/2028). It is a roadmap item for German clients, not for foreign ones.
  - Source: BMF — https://www.bundesfinanzministerium.de/Content/DE/FAQ/e-rechnung.html

## Interview questions (Friday)

1. "Think of your last invoice to a client outside the eurozone (US, UK or CH). How did they pay? How many days did the money take? How much arrived in euros?"
2. "How many hours a month do you spend on invoices, matching payments and preparing data for your Steuerberater? What exactly does your Steuerberater ask for?"
3. "Would your client be willing to pay in USDC or EURC? What would stop *you* from accepting it: tax, your Steuerberater, cashing out, or the client?"
