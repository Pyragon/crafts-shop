"use client";

import { useMemo, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { useCart } from "./CartProvider";
import { formatPrice } from "@/lib/format";
import {
  FREE_SHIPPING_THRESHOLD_CENTS,
  SHIPPING_OPTIONS,
  shippingCostCents,
} from "@/lib/shipping";
import { startCheckout } from "@/app/actions/checkout";

/**
 * Two steps on one page: details, then payment.
 *
 * The details are posted to a Server Action which creates the order and the
 * PaymentIntent, and hands back a client secret. Only then does the card form
 * appear — so the amount the customer authorises is one the server calculated,
 * never one the browser proposed.
 */

const stripePromise = (key: string) => loadStripe(key);

type Props = {
  publishableKey: string | null;
  defaultEmail: string;
};

export function CheckoutForm({ publishableKey, defaultEmail }: Props) {
  const { cart } = useCart();
  const [shippingMethod, setShippingMethod] = useState(SHIPPING_OPTIONS[0].id);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const shipping = shippingCostCents(shippingMethod, cart.subtotalCents);
  const total = cart.subtotalCents + shipping;

  const stripe = useMemo(
    () => (publishableKey ? stripePromise(publishableKey) : null),
    [publishableKey],
  );

  if (!publishableKey) {
    return (
      <p className="rounded-xl bg-clay-tint px-5 py-4 text-sm text-clay">
        Payments aren&apos;t configured yet, so checkout is unavailable.
      </p>
    );
  }

  if (cart.lines.length === 0 && !clientSecret) {
    return (
      <p className="rounded-xl border border-line bg-paper-raised px-5 py-4 text-sm text-ink-soft">
        Your cart is empty.
      </p>
    );
  }

  async function onSubmitDetails(formData: FormData) {
    setPending(true);
    setError(null);
    formData.set("shippingMethod", shippingMethod);
    const result = await startCheckout(formData);
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setClientSecret(result.clientSecret);
    setOrderNumber(result.orderNumber);
  }

  const field =
    "mt-2 w-full appearance-none rounded-lg border border-line-strong bg-paper-raised px-4 py-3 text-sm text-ink outline-none focus:border-clay";
  const label =
    "block text-xs font-semibold uppercase tracking-[0.15em] text-ink-faint";

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_20rem] lg:gap-14">
      <div>
        {error && (
          <p
            role="alert"
            className="mb-6 rounded-xl bg-clay-tint px-4 py-3 text-sm text-clay"
          >
            {error}
          </p>
        )}

        {!clientSecret ? (
          <form action={onSubmitDetails} className="space-y-8">
            <section>
              <h2 className="font-display text-xl text-ink">Contact</h2>
              <div className="mt-4">
                <label htmlFor="email" className={label}>
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  defaultValue={defaultEmail}
                  autoComplete="email"
                  className={field}
                />
                <p className="mt-1.5 text-xs text-ink-faint">
                  Your receipt goes here. No account needed.
                </p>
              </div>
            </section>

            <section>
              <h2 className="font-display text-xl text-ink">Shipping address</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label htmlFor="name" className={label}>Full name</label>
                  <input id="name" name="name" required autoComplete="name" className={field} />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="line1" className={label}>Address</label>
                  <input id="line1" name="line1" required autoComplete="address-line1" className={field} />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="line2" className={label}>
                    Apartment, unit <span className="normal-case tracking-normal">(optional)</span>
                  </label>
                  <input id="line2" name="line2" autoComplete="address-line2" className={field} />
                </div>
                <div>
                  <label htmlFor="city" className={label}>City</label>
                  <input id="city" name="city" required autoComplete="address-level2" className={field} />
                </div>
                <div>
                  <label htmlFor="region" className={label}>Province</label>
                  <input id="region" name="region" autoComplete="address-level1" className={field} />
                </div>
                <div>
                  <label htmlFor="postalCode" className={label}>Postal code</label>
                  <input id="postalCode" name="postalCode" required autoComplete="postal-code" className={field} />
                </div>
                <div>
                  <label htmlFor="country" className={label}>Country</label>
                  <select id="country" name="country" defaultValue="CA" className={field}>
                    <option value="CA">Canada</option>
                    <option value="US">United States</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="phone" className={label}>
                    Phone <span className="normal-case tracking-normal">(optional)</span>
                  </label>
                  <input id="phone" name="phone" type="tel" autoComplete="tel" className={field} />
                  <p className="mt-1.5 text-xs text-ink-faint">
                    Only used if there&apos;s a problem with delivery.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="font-display text-xl text-ink">Delivery</h2>
              <div className="mt-4 space-y-3">
                {SHIPPING_OPTIONS.map((option) => {
                  const cost = shippingCostCents(option.id, cart.subtotalCents);
                  return (
                    <label
                      key={option.id}
                      className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3.5 transition-colors ${
                        shippingMethod === option.id
                          ? "border-clay bg-clay-tint"
                          : "border-line-strong hover:bg-paper-sunk"
                      }`}
                    >
                      <input
                        type="radio"
                        name="shippingMethodRadio"
                        checked={shippingMethod === option.id}
                        onChange={() => setShippingMethod(option.id)}
                        className="accent-clay"
                      />
                      <span className="flex-1">
                        <span className="block text-sm text-ink">{option.label}</span>
                        <span className="block text-xs text-ink-faint">
                          {option.description}
                        </span>
                      </span>
                      <span className="text-sm tabular-nums text-ink">
                        {cost === 0 ? "Free" : formatPrice(cost)}
                      </span>
                    </label>
                  );
                })}
              </div>
            </section>

            <button
              type="submit"
              disabled={pending}
              className="w-full rounded-full bg-clay px-8 py-4 text-sm font-medium text-white transition-colors hover:bg-clay-dark disabled:cursor-not-allowed disabled:bg-line-strong disabled:text-ink-faint sm:w-auto"
            >
              {pending ? "Just a moment…" : "Continue to payment"}
            </button>
          </form>
        ) : (
          <Elements
            stripe={stripe}
            options={{
              clientSecret,
              appearance: {
                theme: "flat",
                variables: {
                  colorPrimary: "#b4562f",
                  colorBackground: "#ffffff",
                  colorText: "#2b2724",
                  fontFamily: "ui-sans-serif, system-ui, sans-serif",
                  borderRadius: "8px",
                },
              },
            }}
          >
            <PaymentStep orderNumber={orderNumber} totalCents={total} />
          </Elements>
        )}
      </div>

      <aside className="lg:sticky lg:top-28 lg:self-start">
        <div className="rounded-2xl border border-line bg-paper-raised p-6">
          <h2 className="font-display text-xl text-ink">Your order</h2>
          <ul className="mt-4 space-y-3 border-b border-line pb-4">
            {cart.lines.map((line) => (
              <li key={line.id} className="flex justify-between gap-3 text-sm">
                <span className="text-ink-soft">
                  {line.quantity} × {line.name}
                  {line.variantLabel && (
                    <span className="block text-xs text-ink-faint">
                      {line.variantLabel}
                    </span>
                  )}
                  {line.personalisation.map((p) => (
                    <span key={p.label} className="block text-xs text-clay">
                      {p.label}: {p.value}
                    </span>
                  ))}
                </span>
                <span className="shrink-0 tabular-nums text-ink">
                  {formatPrice(line.lineTotalCents)}
                </span>
              </li>
            ))}
          </ul>

          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-ink-soft">Subtotal</dt>
              <dd className="tabular-nums text-ink">{formatPrice(cart.subtotalCents)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-soft">Shipping</dt>
              <dd className="tabular-nums text-ink">
                {shipping === 0 ? "Free" : formatPrice(shipping)}
              </dd>
            </div>
          </dl>

          {cart.subtotalCents < FREE_SHIPPING_THRESHOLD_CENTS && (
            <p className="mt-3 rounded-lg bg-paper-sunk px-3 py-2 text-xs text-ink-soft">
              {formatPrice(FREE_SHIPPING_THRESHOLD_CENTS - cart.subtotalCents)} more
              for free standard shipping.
            </p>
          )}

          <div className="mt-4 flex items-baseline justify-between border-t border-line pt-4">
            <span className="text-ink-soft">Total</span>
            <span className="font-display text-2xl tabular-nums text-ink">
              {formatPrice(total)}
            </span>
          </div>
          <p className="mt-2 text-xs text-ink-faint">
            Prices in CAD. Sales tax is not yet calculated.
          </p>
        </div>
      </aside>
    </div>
  );
}

function PaymentStep({
  orderNumber,
  totalCents,
}: {
  orderNumber: string | null;
  totalCents: number;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function pay(event: React.FormEvent) {
    event.preventDefault();
    if (!stripe || !elements) return;

    setPending(true);
    setError(null);

    const { error: stripeError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/checkout/success`,
      },
    });

    // Only card errors and validation problems come back here; anything else
    // has already redirected. The order is marked paid by the webhook, not by
    // whatever happens after this point.
    setPending(false);
    if (stripeError) {
      setError(stripeError.message ?? "That payment didn't go through.");
    }
  }

  return (
    <form onSubmit={pay} className="space-y-6">
      <div>
        <h2 className="font-display text-xl text-ink">Payment</h2>
        {orderNumber && (
          <p className="mt-1 text-xs text-ink-faint">Order {orderNumber}</p>
        )}
      </div>

      <PaymentElement />

      {error && (
        <p role="alert" className="rounded-xl bg-clay-tint px-4 py-3 text-sm text-clay">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={!stripe || pending}
        className="w-full rounded-full bg-clay px-8 py-4 text-sm font-medium text-white transition-colors hover:bg-clay-dark disabled:cursor-not-allowed disabled:bg-line-strong disabled:text-ink-faint"
      >
        {pending ? "Taking payment…" : `Pay ${formatPrice(totalCents)}`}
      </button>
      <p className="text-center text-xs text-ink-faint">
        Card details go straight to Stripe and never touch this server.
      </p>
    </form>
  );
}
