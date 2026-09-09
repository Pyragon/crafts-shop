"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "./CartProvider";
import { QuantityStepper } from "./QuantityStepper";
import { swatchFor } from "@/lib/swatch";
import { ArrowIcon } from "./icons";
import { formatPrice } from "@/lib/format";

const FREE_SHIPPING_CENTS = 7500;

export function CartPageContents() {
  const { cart, update, remove, isPending, error } = useCart();

  if (cart.lines.length === 0) {
    return (
      <div className="py-20 text-center">
        <p className="font-display text-3xl text-ink">Your cart is empty</p>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-ink-soft">
          Everything here is made in small batches, so what is in stock is
          genuinely what there is.
        </p>
        <Link
          href="/shop"
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-clay px-7 py-3.5 text-sm font-medium text-white transition-colors hover:bg-clay-dark"
        >
          Browse the shop
          <ArrowIcon width={16} height={16} />
        </Link>
      </div>
    );
  }

  const remaining = FREE_SHIPPING_CENTS - cart.subtotalCents;

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_20rem] lg:gap-16">
      <div>
        {error && (
          <p
            role="status"
            className="mb-6 rounded-xl bg-clay-tint px-4 py-3 text-sm text-clay"
          >
            {error}
          </p>
        )}

        <ul className="divide-y divide-line border-y border-line">
          {cart.lines.map((line) => {
            const [from, to] = swatchFor(line.slug);
            return (
              <li key={line.id} className="flex gap-4 py-6 sm:gap-6">
                <Link
                  href={`/shop/${line.slug}`}
                  className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl border border-line sm:h-32 sm:w-32"
                >
                  {line.image ? (
                    <Image
                      src={line.image.url}
                      alt={line.image.alt}
                      fill
                      sizes="128px"
                      className="object-cover"
                    />
                  ) : (
                    <span
                      aria-hidden
                      className="absolute inset-0"
                      style={{
                        background: `linear-gradient(145deg, ${from}, ${to})`,
                      }}
                    />
                  )}
                </Link>

                <div className="min-w-0 flex-1">
                  <div className="flex justify-between gap-4">
                    <Link
                      href={`/shop/${line.slug}`}
                      className="font-display text-lg leading-snug text-ink transition-colors hover:text-clay"
                    >
                      {line.name}
                    </Link>
                    <p className="shrink-0 text-sm tabular-nums text-ink">
                      {formatPrice(line.lineTotalCents)}
                    </p>
                  </div>

                  {line.variantLabel && (
                    <p className="mt-1 text-sm text-ink-soft">
                      {line.variantLabel}
                    </p>
                  )}
                  <p className="mt-1 line-clamp-2 text-sm text-ink-faint">
                    {line.blurb}
                  </p>
                  <p className="mt-1 text-sm text-ink-faint">
                    {formatPrice(line.unitPriceCents)} each
                  </p>

                  <div className="mt-4 flex flex-wrap items-center gap-4">
                    <QuantityStepper
                      quantity={line.quantity}
                      max={line.stock}
                      disabled={isPending}
                      label={line.name}
                      onChange={(q) => update(line.id, q)}
                    />
                    <button
                      type="button"
                      onClick={() => remove(line.id)}
                      disabled={isPending}
                      className="text-sm text-ink-faint underline underline-offset-4 transition-colors hover:text-clay"
                    >
                      Remove
                    </button>
                    {line.quantity >= line.stock && (
                      <span className="text-xs text-clay">
                        All {line.stock} in stock
                      </span>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        <Link
          href="/shop"
          className="mt-8 inline-flex items-center gap-2 text-sm font-medium text-clay hover:text-clay-dark"
        >
          <ArrowIcon width={15} height={15} className="rotate-180" />
          Continue shopping
        </Link>
      </div>

      <aside className="lg:sticky lg:top-28 lg:self-start">
        <div className="rounded-2xl border border-line bg-paper-raised p-6">
          <h2 className="font-display text-xl text-ink">Summary</h2>

          <dl className="mt-5 space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-ink-soft">
                Subtotal ({cart.count} {cart.count === 1 ? "item" : "items"})
              </dt>
              <dd className="tabular-nums text-ink">
                {formatPrice(cart.subtotalCents)}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-soft">Shipping</dt>
              <dd className="text-ink-faint">Calculated at checkout</dd>
            </div>
          </dl>

          {remaining > 0 ? (
            <p className="mt-5 rounded-lg bg-paper-sunk px-4 py-3 text-xs leading-relaxed text-ink-soft">
              {formatPrice(remaining)} more for free shipping.
            </p>
          ) : (
            <p className="mt-5 rounded-lg bg-sage-tint px-4 py-3 text-xs text-sage">
              This order qualifies for free shipping.
            </p>
          )}

          <div className="mt-5 flex items-baseline justify-between border-t border-line pt-5">
            <span className="text-ink-soft">Total</span>
            <span className="font-display text-2xl tabular-nums text-ink">
              {formatPrice(cart.subtotalCents)}
            </span>
          </div>

          {/* Checkout arrives in Phase 4. Disabled rather than hidden so the
              layout doesn't move when it becomes real. */}
          <button
            type="button"
            disabled
            aria-disabled
            title="Checkout arrives in a later phase"
            className="mt-6 w-full rounded-full bg-line-strong px-6 py-3.5 text-sm font-medium text-ink-faint"
          >
            Checkout
          </button>
          <p className="mt-2 text-center text-xs text-ink-faint">
            Payments are not wired up yet.
          </p>
        </div>
      </aside>
    </div>
  );
}
