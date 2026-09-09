"use client";

import { useMemo, useState } from "react";
import { useCart } from "./CartProvider";
import { ArrowIcon } from "./icons";
import { formatPrice } from "@/lib/format";
import {
  axisValueAvailable,
  findVariant,
  valuesForAxis,
  variantPrice,
  type OptionLike,
  type VariantLike,
} from "@/lib/variants";

/**
 * Option selection plus add-to-cart.
 *
 * Values that lead nowhere — a combination that doesn't exist, or one that is
 * sold out — are shown struck through and disabled rather than hidden, so the
 * range on offer stays visible and nobody can select their way into a dead end.
 */
export function VariantPicker({
  options,
  variants,
  basePriceCents,
}: {
  options: OptionLike[];
  variants: VariantLike[];
  basePriceCents: number;
}) {
  const { add, isPending } = useCart();

  // Start on the first variant that's actually buyable, so the common case
  // needs no clicks at all.
  const initial = useMemo(() => {
    const firstInStock = variants.find((v) => v.stock > 0) ?? variants[0];
    return [
      firstInStock?.option1 ?? null,
      firstInStock?.option2 ?? null,
      firstInStock?.option3 ?? null,
    ];
  }, [variants]);

  const [selection, setSelection] = useState<(string | null)[]>(initial);

  const selected = findVariant(variants, selection);
  const price = selected
    ? variantPrice(selected, basePriceCents)
    : basePriceCents;
  const soldOut = !selected || selected.stock === 0;

  const choose = (axis: number, value: string) => {
    const next = [...selection];
    next[axis] = value;

    // If the new combination doesn't exist, relax the other axes onto
    // something that does rather than leaving a dead selection on screen.
    if (!findVariant(variants, next)) {
      const fallback =
        variants.find(
          (v) =>
            [v.option1, v.option2, v.option3][axis] === value && v.stock > 0,
        ) ??
        variants.find(
          (v) => [v.option1, v.option2, v.option3][axis] === value,
        );
      if (fallback) {
        setSelection([
          fallback.option1 ?? null,
          fallback.option2 ?? null,
          fallback.option3 ?? null,
        ]);
        return;
      }
    }
    setSelection(next);
  };

  return (
    <div>
      {options.map((option, axis) => {
        const values = valuesForAxis(variants, axis);
        if (values.length === 0) return null;

        return (
          <fieldset key={option.name} className="mt-7">
            <legend className="text-xs font-semibold uppercase tracking-[0.15em] text-ink-faint">
              {option.name}
              {selection[axis] && (
                <span className="ml-2 normal-case tracking-normal text-ink-soft">
                  {selection[axis]}
                </span>
              )}
            </legend>
            <div className="mt-3 flex flex-wrap gap-2">
              {values.map((value) => {
                const active = selection[axis] === value;
                const available = axisValueAvailable(
                  variants,
                  selection,
                  axis,
                  value,
                );
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => choose(axis, value)}
                    aria-pressed={active}
                    title={available ? undefined : "Sold out"}
                    className={`rounded-full border px-4 py-2 text-sm transition-colors ${
                      active
                        ? "border-clay bg-clay-tint text-clay"
                        : "border-line-strong text-ink-soft hover:bg-paper-sunk"
                    } ${available ? "" : "text-ink-faint line-through opacity-60"}`}
                  >
                    {value}
                  </button>
                );
              })}
            </div>
          </fieldset>
        );
      })}

      <div className="mt-8 flex items-baseline gap-3">
        <span className="font-display text-3xl text-ink">
          {formatPrice(price)}
        </span>
        {selected?.sku && (
          <span className="text-xs text-ink-faint">{selected.sku}</span>
        )}
      </div>

      <p className="mt-2 text-sm" aria-live="polite">
        {!selected ? (
          <span className="text-ink-faint">
            That combination isn&apos;t made — pick another.
          </span>
        ) : selected.stock === 0 ? (
          <span className="text-ink-faint">
            Sold out — the next batch is usually a few weeks away.
          </span>
        ) : selected.stock <= 3 ? (
          <span className="text-clay">Only {selected.stock} left</span>
        ) : (
          <span className="text-sage">In stock, ready to ship</span>
        )}
      </p>

      <button
        type="button"
        onClick={() => selected && add(selected.id)}
        disabled={soldOut || isPending}
        className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-clay px-8 py-4 text-sm font-medium text-white transition-colors hover:bg-clay-dark disabled:cursor-not-allowed disabled:bg-line-strong disabled:text-ink-faint sm:w-auto"
      >
        {soldOut ? "Sold out" : isPending ? "Adding…" : "Add to cart"}
        {!soldOut && !isPending && <ArrowIcon width={16} height={16} />}
      </button>
    </div>
  );
}
