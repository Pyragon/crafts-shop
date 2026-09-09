/**
 * Shipping options.
 *
 * Flat rates rather than carrier-calculated. For a shop sending small parcels
 * within Canada, real-time rates add an integration and a failure mode for
 * pennies of accuracy. Revisit if international becomes a real share of orders.
 *
 * Dependency-free so the checkout form can price options without a round trip.
 */

export const FREE_SHIPPING_THRESHOLD_CENTS = 7500;

export type ShippingOption = {
  id: string;
  label: string;
  description: string;
  priceCents: number;
};

export const SHIPPING_OPTIONS: ShippingOption[] = [
  {
    id: "standard",
    label: "Standard",
    description: "3–7 business days",
    priceCents: 800,
  },
  {
    id: "express",
    label: "Express",
    description: "1–2 business days",
    priceCents: 1800,
  },
];

export function shippingCostCents(optionId: string, subtotalCents: number): number {
  const option = SHIPPING_OPTIONS.find((o) => o.id === optionId);
  if (!option) return SHIPPING_OPTIONS[0].priceCents;
  // Standard is free over the threshold; express is always paid, or the
  // threshold would quietly subsidise the expensive option.
  if (option.id === "standard" && subtotalCents >= FREE_SHIPPING_THRESHOLD_CENTS) {
    return 0;
  }
  return option.priceCents;
}

export function isShippingOption(id: string | undefined): id is string {
  return !!id && SHIPPING_OPTIONS.some((o) => o.id === id);
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
