import type { ClientType, Profile } from "./types";

/**
 * VAT treatment and the legally required invoice notes for a German freelancer.
 * Sources: § 14a UStG (reverse charge note), § 19 UStG (Kleinunternehmer),
 * IHK Köln "Reverse-Charge-Verfahren". Always confirm edge cases with a Steuerberater.
 */
export const CLIENT_TYPES: { value: ClientType; label: string; hint: string }[] = [
  { value: "de", label: "Germany", hint: "German VAT applies" },
  { value: "eu", label: "EU business", hint: "Reverse charge — 0 % VAT, client's VAT ID required" },
  { value: "intl", label: "Outside the EU", hint: "Not taxable in Germany — 0 % VAT (e.g. US, UK, CH)" },
];

/** True if this invoice must show 0 % VAT regardless of the chosen rate. */
export function isZeroVat(clientType: ClientType, smallBusiness: boolean) {
  return smallBusiness || clientType !== "de";
}

/** The note that has to be printed on the invoice. */
export function taxNote(clientType: ClientType, smallBusiness: boolean): string | null {
  if (smallBusiness && clientType === "de") return "Gemäß § 19 UStG wird keine Umsatzsteuer berechnet.";
  if (clientType === "eu")
    return "Steuerschuldnerschaft des Leistungsempfängers (Reverse Charge, § 13b UStG / Art. 196 MwStSystRL).";
  if (clientType === "intl") return "Nicht im Inland steuerbare Leistung.";
  if (smallBusiness) return "Gemäß § 19 UStG wird keine Umsatzsteuer berechnet.";
  return null;
}

export function revenueAccountFor(clientType: ClientType, profile: Profile): string {
  if (clientType === "eu") return profile.datevRevenueAccountEU;
  if (clientType === "intl") return profile.datevRevenueAccountIntl;
  return profile.datevRevenueAccount;
}
