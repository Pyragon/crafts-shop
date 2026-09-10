/**
 * Shipping rates.
 *
 * Flat rates by destination zone, not carrier-calculated. For small parcels
 * this is honest and predictable, and it avoids an integration whose outage
 * would take checkout down. Revisit when international volume justifies live
 * rates — the shape below is designed so that becomes a swap of `rateFor`,
 * not a rewrite.
 *
 * Dependency-free so the checkout can price options without a round trip.
 */

export const FREE_SHIPPING_THRESHOLD_CENTS = 7500;

/** Destination groups. Rates differ per zone; methods do not. */
export type ShippingZone = "CA" | "US" | "INTL";

export type ShippingCountry = {
  code: string;
  name: string;
  zone: ShippingZone;
};

/**
 * Where the shop currently ships.
 *
 * Canada only for now — MaBrown posts with Canada Post domestically. The US
 * and international entries are defined but disabled, so turning them on is a
 * one-line change with rates already thought through, rather than an
 * afterthought at the moment someone wants to order from abroad.
 *
 * Leaving a country selectable without a matching rate is worse than not
 * offering it: the order goes through underpriced and the shop absorbs the
 * difference.
 */
export const SHIPPING_COUNTRIES: ShippingCountry[] = [
  { code: "CA", name: "Canada", zone: "CA" },
];

export const FUTURE_SHIPPING_COUNTRIES: ShippingCountry[] = [
  { code: "US", name: "United States", zone: "US" },
  { code: "GB", name: "United Kingdom", zone: "INTL" },
  { code: "AU", name: "Australia", zone: "INTL" },
];

export type ShippingMethod = {
  id: string;
  label: string;
  /** Per zone, because "3–7 days" means nothing across a border. */
  description: Record<ShippingZone, string>;
};

export const SHIPPING_METHODS: ShippingMethod[] = [
  {
    id: "standard",
    label: "Standard",
    description: {
      CA: "3–7 business days, Canada Post",
      US: "7–14 business days",
      INTL: "2–4 weeks",
    },
  },
  {
    id: "express",
    label: "Express",
    description: {
      CA: "1–2 business days",
      US: "3–5 business days",
      INTL: "5–10 business days",
    },
  },
];

/**
 * Base rates in cents, by zone and method.
 *
 * ⚠️ THESE NUMBERS ARE PLACEHOLDERS. They were invented to look plausible.
 * They are not Canada Post rates, not from any rate table, and not derived
 * from parcel weights — because no product here records a weight or packed
 * size, so no real rate can be computed.
 *
 * Replace them before taking real money. Charging too little loses money on
 * every order; charging too much loses the order. Either needs real figures.
 * See TODO.md for what is needed to work them out.
 */
const RATES: Record<ShippingZone, Record<string, number>> = {
  CA: { standard: 800, express: 1800 },
  US: { standard: 1800, express: 3500 },
  INTL: { standard: 3500, express: 6500 },
};

/** Free-shipping threshold applies domestically only — see `shippingCostCents`. */
const FREE_THRESHOLD_ZONES: ShippingZone[] = ["CA"];

export function zoneFor(countryCode: string): ShippingZone {
  const known = [...SHIPPING_COUNTRIES, ...FUTURE_SHIPPING_COUNTRIES].find(
    (c) => c.code === countryCode.toUpperCase(),
  );
  // Unknown countries are treated as international rather than domestic, so a
  // mistake costs the customer nothing and the shop nothing.
  return known?.zone ?? "INTL";
}

export function canShipTo(countryCode: string): boolean {
  return SHIPPING_COUNTRIES.some(
    (c) => c.code === countryCode.toUpperCase(),
  );
}

export function shippingCostCents(
  methodId: string,
  subtotalCents: number,
  countryCode: string,
): number {
  const zone = zoneFor(countryCode);
  const rates = RATES[zone];
  const price = rates[methodId] ?? rates.standard;

  // Standard shipping is free over the threshold, domestically only. Express
  // is always paid, or the threshold would quietly subsidise the expensive
  // option; and abroad the postage is too large to give away.
  if (
    methodId === "standard" &&
    FREE_THRESHOLD_ZONES.includes(zone) &&
    subtotalCents >= FREE_SHIPPING_THRESHOLD_CENTS
  ) {
    return 0;
  }
  return price;
}

export function isShippingMethod(id: string | undefined): id is string {
  return !!id && SHIPPING_METHODS.some((m) => m.id === id);
}

export function methodDescription(methodId: string, countryCode: string): string {
  const method = SHIPPING_METHODS.find((m) => m.id === methodId);
  return method ? method.description[zoneFor(countryCode)] : "";
}

/**
 * Sales tax is not calculated yet.
 *
 * Canadian sales tax is destination-based: GST/HST plus provincial rates that
 * differ by province, and registration thresholds that depend on revenue.
 * Guessing a single rate would be worse than charging none, so this returns 0
 * and the checkout says tax is not included. See TODO.md — this must be
 * resolved before launch, most likely with Stripe Tax.
 */
export function taxCents(): number {
  return 0;
}
