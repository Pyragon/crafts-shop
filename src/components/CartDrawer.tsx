"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { useCart } from "./CartProvider";
import { QuantityStepper } from "./QuantityStepper";
import { CloseIcon } from "./icons";
import { formatPrice } from "@/lib/format";
import { swatchFor } from "@/lib/swatch";

export function CartDrawer() {
  const { cart, isOpen, close, update, remove, isPending, error } = useCart();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    panelRef.current?.querySelector<HTMLElement>("button, a")?.focus();
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKey);
    };
  }, [isOpen, close]);

  return (
    // The open/closed state is driven by inline styles, not utility classes.
    // Next's dev CSS chunk keeps a stable URL while its contents change, so a
    // cached stylesheet can be missing a newly-used class — which once left
    // this drawer permanently on screen and unclickable. Inline styles ship
    // with the markup and cannot go stale. `inert` also keeps the closed
    // drawer out of the tab order.
    <div
      className="fixed inset-0 z-50"
      style={{ pointerEvents: isOpen ? "auto" : "none" }}
      aria-hidden={!isOpen}
      inert={!isOpen}
    >
      <button
        type="button"
        tabIndex={-1}
        aria-label="Close cart"
        onClick={close}
        className="absolute inset-0 bg-ink/40 transition-opacity duration-300"
        style={{ opacity: isOpen ? 1 : 0 }}
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal={isOpen}
        aria-label="Shopping cart"
        className="absolute inset-y-0 right-0 flex w-[min(26rem,92vw)] flex-col bg-paper shadow-2xl transition-transform duration-300 [transition-timing-function:var(--ease-out-soft)]"
        style={{ transform: isOpen ? "translateX(0)" : "translateX(100%)" }}
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-line px-5">
          <h2 className="font-display text-lg text-ink">
            Your cart
            {cart.count > 0 && (
              <span className="ml-2 text-sm text-ink-faint">
                ({cart.count})
              </span>
            )}
          </h2>
          <button
            type="button"
            onClick={close}
            aria-label="Close cart"
            className="-mr-2 rounded-full p-2 text-ink transition-colors hover:bg-paper-sunk"
          >
            <CloseIcon width={22} height={22} />
          </button>
        </div>

        {error && (
          <p
            role="status"
            className="border-b border-line bg-clay-tint px-5 py-3 text-sm text-clay"
          >
            {error}
          </p>
        )}

        <div className="flex-1 overflow-y-auto px-5">
          {cart.lines.length === 0 ? (
            <div className="py-16 text-center">
              <p className="font-display text-xl text-ink">
                Your cart is empty
              </p>
              <p className="mt-2 text-sm text-ink-soft">
                Everything is made in small batches, so it moves quickly.
              </p>
              <Link
                href="/shop"
                onClick={close}
                className="mt-6 inline-flex rounded-full bg-clay px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-clay-dark"
              >
                Browse the shop
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {cart.lines.map((line) => {
                const [from, to] = swatchFor(line.slug);
                return (
                  <li key={line.id} className="flex gap-4 py-5">
                    <Link
                      href={`/shop/${line.slug}`}
                      onClick={close}
                      className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-line"
                    >
                      {line.image ? (
                        <Image
                          src={line.image.url}
                          alt={line.image.alt}
                          fill
                          sizes="80px"
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
                      <Link
                        href={`/shop/${line.slug}`}
                        onClick={close}
                        className="font-display text-base leading-snug text-ink transition-colors hover:text-clay"
                      >
                        {line.name}
                      </Link>
                      {line.variantLabel && (
                        <p className="mt-0.5 text-xs text-ink-faint">
                          {line.variantLabel}
                        </p>
                      )}
                      {line.personalisation.map((f) => (
                        <p key={f.label} className="mt-0.5 text-xs text-clay">
                          {f.label}: “{f.value}”
                        </p>
                      ))}
                      <p className="mt-0.5 text-sm text-ink-soft">
                        {formatPrice(line.unitPriceCents)}
                      </p>

                      <div className="mt-3 flex items-center justify-between gap-2">
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
                          className="text-xs text-ink-faint underline underline-offset-4 transition-colors hover:text-clay"
                        >
                          Remove
                        </button>
                      </div>
                    </div>

                    <p className="shrink-0 text-sm tabular-nums text-ink">
                      {formatPrice(line.lineTotalCents)}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {cart.lines.length > 0 && (
          <div className="shrink-0 border-t border-line px-5 py-5">
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-ink-soft">Subtotal</span>
              <span className="font-display text-xl text-ink tabular-nums">
                {formatPrice(cart.subtotalCents)}
              </span>
            </div>
            <p className="mt-1 text-xs text-ink-faint">
              Shipping and taxes are worked out at checkout.
            </p>
            <Link
              href="/cart"
              onClick={close}
              className="mt-4 flex w-full items-center justify-center rounded-full bg-clay px-6 py-3.5 text-sm font-medium text-white transition-colors hover:bg-clay-dark"
            >
              View cart
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
