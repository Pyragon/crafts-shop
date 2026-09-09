/**
 * Variant helpers.
 *
 * Dependency-free so client components can use them — see the note in
 * `swatch.ts` about why anything shared must not reach the database layer.
 */

/** Just the option columns — all that labelling needs. */
export type VariantOptions = {
  option1: string | null;
  option2: string | null;
  option3: string | null;
};

export type VariantLike = VariantOptions & {
  id: string;
  priceCents: number | null;
  stock: number;
  sku?: string | null;
};

export type OptionLike = {
  name: string;
  position: number;
};

/** The option values of a variant, in axis order, with blanks dropped. */
export function variantValues(variant: VariantOptions): string[] {
  return [variant.option1, variant.option2, variant.option3].filter(
    (v): v is string => v !== null && v !== "",
  );
}

/** "Oatmeal / Large", or "" for a product with no options. */
export function variantLabel(variant: VariantOptions): string {
  return variantValues(variant).join(" / ");
}

/** Variant price, falling back to the product's base price. */
export function variantPrice(
  variant: { priceCents: number | null },
  basePriceCents: number,
): number {
  return variant.priceCents ?? basePriceCents;
}

export function totalStock(variants: { stock: number }[]): number {
  return variants.reduce((n, v) => n + v.stock, 0);
}

/** Cheapest and dearest buyable price, for "from £x" on listing cards. */
export function priceRange(
  variants: { priceCents: number | null }[],
  basePriceCents: number,
): { min: number; max: number } {
  if (variants.length === 0) {
    return { min: basePriceCents, max: basePriceCents };
  }
  const prices = variants.map((v) => variantPrice(v, basePriceCents));
  return { min: Math.min(...prices), max: Math.max(...prices) };
}

/** Distinct values for one axis, in the order variants define them. */
export function valuesForAxis(
  variants: VariantOptions[],
  axis: number,
): string[] {
  const key = (["option1", "option2", "option3"] as const)[axis];
  const seen: string[] = [];
  for (const v of variants) {
    const value = v[key];
    if (value && !seen.includes(value)) seen.push(value);
  }
  return seen;
}

/** The variant matching an exact set of option values, if any. */
export function findVariant(
  variants: VariantLike[],
  selection: (string | null)[],
): VariantLike | undefined {
  return variants.find((v) => {
    const values = [v.option1, v.option2, v.option3];
    return selection.every((want, i) => want === null || values[i] === want);
  });
}

/**
 * Whether choosing `value` on `axis` leaves anything in stock, given the other
 * axes already chosen. Lets the picker grey out combinations that don't exist
 * or are sold out, instead of letting someone pick their way into a dead end.
 */
export function axisValueAvailable(
  variants: VariantLike[],
  selection: (string | null)[],
  axis: number,
  value: string,
): boolean {
  const probe = [...selection];
  probe[axis] = value;
  return variants.some((v) => {
    const values = [v.option1, v.option2, v.option3];
    const matches = probe.every(
      (want, i) => want === null || i === axis || values[i] === want,
    );
    return matches && values[axis] === value && v.stock > 0;
  });
}
