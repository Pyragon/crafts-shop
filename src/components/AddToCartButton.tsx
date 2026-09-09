"use client";

import { useCart } from "./CartProvider";
import { ArrowIcon } from "./icons";

export function AddToCartButton({
  productId,
  soldOut,
}: {
  productId: string;
  soldOut: boolean;
}) {
  const { add, isPending } = useCart();

  return (
    <button
      type="button"
      onClick={() => add(productId)}
      disabled={soldOut || isPending}
      className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-full bg-clay px-8 py-4 text-sm font-medium text-white transition-colors hover:bg-clay-dark disabled:cursor-not-allowed disabled:bg-line-strong disabled:text-ink-faint sm:w-auto"
    >
      {soldOut ? "Sold out" : isPending ? "Adding…" : "Add to cart"}
      {!soldOut && !isPending && <ArrowIcon width={16} height={16} />}
    </button>
  );
}
