const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

/** Prices are stored as integer cents to avoid float drift. */
export function formatPrice(cents: number): string {
  return currency.format(cents / 100);
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
