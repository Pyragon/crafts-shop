import type { Metadata } from "next";
import Link from "next/link";
import { getOrderByPaymentIntent } from "@/lib/orders";
import { formatPrice } from "@/lib/format";
import { ArrowIcon } from "@/components/icons";

export const metadata: Metadata = {
  title: "Order confirmed",
  robots: { index: false, follow: false },
};

export default async function CheckoutSuccessPage({
  searchParams,
}: PageProps<"/checkout/success">) {
  const params = (await searchParams) as {
    payment_intent?: string;
    redirect_status?: string;
  };

  const order = params.payment_intent
    ? await getOrderByPaymentIntent(params.payment_intent)
    : null;

  if (!order) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center sm:px-6">
        <h1 className="font-display text-3xl text-ink">
          We couldn&apos;t find that order
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-ink-soft">
          If you were charged, the confirmation email has the details — and the
          order is safe regardless. Get in touch and we&apos;ll sort it out.
        </p>
        <Link
          href="/shop"
          className="mt-8 inline-flex rounded-full border border-line-strong px-6 py-3 text-sm text-ink"
        >
          Back to the shop
        </Link>
      </div>
    );
  }

  // The webhook marks the order paid, and it may land a moment after the
  // customer is redirected back. Saying "processing" is honest; claiming
  // failure would not be.
  const settled = order.status !== "PENDING";

  return (
    <div className="mx-auto max-w-2xl px-4 py-14 sm:px-6 lg:py-20">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-clay">
        {settled ? "Order confirmed" : "Payment received"}
      </p>
      <h1 className="mt-4 font-display text-4xl leading-tight text-ink sm:text-5xl">
        Thank you.
      </h1>
      <p className="mt-4 text-base leading-relaxed text-ink-soft">
        {settled
          ? `Order ${order.number} is confirmed. A receipt is on its way to ${order.email}.`
          : `We've got your payment and are finishing up order ${order.number}. The receipt will arrive at ${order.email} shortly.`}
      </p>

      <div className="mt-10 rounded-2xl border border-line bg-paper-raised p-6">
        <h2 className="font-display text-xl text-ink">What&apos;s coming</h2>
        <ul className="mt-4 divide-y divide-line">
          {order.items.map((item) => (
            <li key={item.id} className="flex justify-between gap-4 py-3 text-sm">
              <span className="text-ink-soft">
                {item.quantity} × {item.productName}
                {item.variantLabel && (
                  <span className="block text-xs text-ink-faint">
                    {item.variantLabel}
                  </span>
                )}
                {item.personalisation.map((p) => (
                  <span key={p.id} className="block text-xs text-clay">
                    {p.label}: {p.value}
                  </span>
                ))}
              </span>
              <span className="shrink-0 tabular-nums text-ink">
                {formatPrice(item.lineTotalCents)}
              </span>
            </li>
          ))}
        </ul>

        <dl className="mt-4 space-y-2 border-t border-line pt-4 text-sm">
          <div className="flex justify-between">
            <dt className="text-ink-soft">Subtotal</dt>
            <dd className="tabular-nums text-ink">{formatPrice(order.subtotalCents)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-ink-soft">Shipping</dt>
            <dd className="tabular-nums text-ink">
              {order.shippingCents === 0 ? "Free" : formatPrice(order.shippingCents)}
            </dd>
          </div>
          <div className="flex justify-between border-t border-line pt-2">
            <dt className="text-ink">Total</dt>
            <dd className="font-display text-lg tabular-nums text-ink">
              {formatPrice(order.totalCents)}
            </dd>
          </div>
        </dl>

        <div className="mt-6 border-t border-line pt-4 text-sm">
          <p className="text-ink-faint">Sending to</p>
          <address className="mt-1 not-italic leading-relaxed text-ink-soft">
            {order.shipName}
            <br />
            {order.shipLine1}
            {order.shipLine2 && (
              <>
                <br />
                {order.shipLine2}
              </>
            )}
            <br />
            {order.shipCity}
            {order.shipRegion ? `, ${order.shipRegion}` : ""} {order.shipPostalCode}
            <br />
            {order.shipCountry}
          </address>
        </div>
      </div>

      <p className="mt-8 text-sm leading-relaxed text-ink-soft">
        Everything is made by hand in small batches, so allow a little time
        before it ships. You&apos;ll hear from us when it&apos;s on its way.
      </p>

      <Link
        href="/shop"
        className="mt-8 inline-flex items-center gap-2 rounded-full bg-clay px-7 py-3.5 text-sm font-medium text-white transition-colors hover:bg-clay-dark"
      >
        Keep browsing
        <ArrowIcon width={16} height={16} />
      </Link>
    </div>
  );
}
