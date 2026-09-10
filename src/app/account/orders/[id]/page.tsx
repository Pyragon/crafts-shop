import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/require-auth";
import {
  customerVisibleEvents,
  getOrderForUser,
} from "@/lib/orders";
import { formatPrice } from "@/lib/format";
import { site } from "@/lib/site";
import { OrderStatusBadge } from "@/components/OrderStatusBadge";
import { PrintButton } from "@/components/PrintButton";

export const metadata: Metadata = {
  title: "Order",
  robots: { index: false, follow: false },
};

const EVENT_LABELS: Record<string, string> = {
  CREATED: "Order placed",
  PAYMENT_SUCCEEDED: "Payment received",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  REFUNDED: "Refunded",
};

function longDate(date: Date): string {
  return date.toLocaleDateString("en-CA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function OrderDetailPage({
  params,
}: PageProps<"/account/orders/[id]">) {
  const { id } = await params;
  const user = await requireUser(`/account/orders/${id}`);
  const order = await getOrderForUser(id, user.id);
  // Someone else's order and a nonexistent one both 404, so this page cannot
  // be used to find out which order ids are real.
  if (!order) notFound();

  const events = customerVisibleEvents(order);

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:py-16">
      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-ink-faint print:hidden">
        <Link href="/account" className="transition-colors hover:text-clay">
          Account
        </Link>
        <span aria-hidden> / </span>
        <Link href="/account/orders" className="transition-colors hover:text-clay">
          Orders
        </Link>
        <span aria-hidden> / </span>
        <span className="text-ink-soft">{order.number}</span>
      </nav>

      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-line pb-6">
        <div>
          <h1 className="font-display text-4xl text-ink">{order.number}</h1>
          <p className="mt-1.5 text-sm text-ink-soft">
            Placed {longDate(order.createdAt)}
          </p>
        </div>
        <div className="flex flex-col items-start gap-2 sm:items-end">
          <OrderStatusBadge
            paymentStatus={order.paymentStatus}
            fulfilmentStatus={order.fulfilmentStatus}
          />
          {/* Printing is the pragmatic answer to "I need an invoice": the
              browser makes the PDF, so there is no rendering dependency and
              nothing to keep in sync with the page. */}
          <PrintButton />
        </div>
      </header>

      {/* Only shown when printing: an invoice needs a letterhead. */}
      <div className="hidden print:mb-6 print:block">
        <p className="font-display text-2xl">{site.name}</p>
        <p className="text-sm">{site.contact.email}</p>
      </div>

      <section className="mt-8">
        <h2 className="font-display text-xl text-ink">Items</h2>
        <ul className="mt-4 divide-y divide-line border-y border-line">
          {order.items.map((item) => (
            <li key={item.id} className="flex gap-4 py-4">
              <div className="min-w-0 flex-1">
                <Link
                  href={`/shop/${item.productSlug}`}
                  className="text-ink transition-colors hover:text-clay print:no-underline"
                >
                  {item.productName}
                </Link>
                {item.variantLabel && (
                  <p className="mt-0.5 text-sm text-ink-faint">
                    {item.variantLabel}
                  </p>
                )}
                {item.personalisation.length > 0 && (
                  <dl className="mt-1.5 space-y-0.5">
                    {item.personalisation.map((p) => (
                      <div key={p.id} className="flex gap-2 text-sm">
                        <dt className="text-ink-faint">{p.label}:</dt>
                        <dd className="text-clay">“{p.value}”</dd>
                      </div>
                    ))}
                  </dl>
                )}
                {item.sku && (
                  <p className="mt-1 text-xs text-ink-faint">{item.sku}</p>
                )}
              </div>
              <div className="shrink-0 text-right text-sm">
                <p className="text-ink-soft">
                  {item.quantity} × {formatPrice(item.unitPriceCents)}
                </p>
                <p className="mt-0.5 tabular-nums text-ink">
                  {formatPrice(item.lineTotalCents)}
                </p>
              </div>
            </li>
          ))}
        </ul>

        <dl className="mt-5 ml-auto max-w-xs space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-ink-soft">Subtotal</dt>
            <dd className="tabular-nums text-ink">
              {formatPrice(order.subtotalCents)}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-ink-soft">
              Shipping{order.shippingMethod ? ` (${order.shippingMethod})` : ""}
            </dt>
            <dd className="tabular-nums text-ink">
              {order.shippingCents === 0 ? "Free" : formatPrice(order.shippingCents)}
            </dd>
          </div>
          {order.taxCents > 0 && (
            <div className="flex justify-between">
              <dt className="text-ink-soft">Tax</dt>
              <dd className="tabular-nums text-ink">{formatPrice(order.taxCents)}</dd>
            </div>
          )}
          <div className="flex justify-between border-t border-line pt-2">
            <dt className="text-ink">Total paid</dt>
            <dd className="font-display text-lg tabular-nums text-ink">
              {formatPrice(order.totalCents)} {order.currency.toUpperCase()}
            </dd>
          </div>
        </dl>
      </section>

      <div className="mt-10 grid gap-8 sm:grid-cols-2">
        <section>
          <h2 className="font-display text-xl text-ink">Shipping to</h2>
          <address className="mt-3 not-italic text-sm leading-relaxed text-ink-soft">
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
            {order.shipPhone && (
              <>
                <br />
                {order.shipPhone}
              </>
            )}
          </address>

          {order.trackingNumber && (
            <div className="mt-4 rounded-xl border border-line bg-paper-raised p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-ink-faint">
                {order.carrier ?? "Tracking"}
              </p>
              {order.trackingUrl ? (
                <a
                  href={order.trackingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 block text-sm text-clay underline underline-offset-4"
                >
                  {order.trackingNumber}
                </a>
              ) : (
                <p className="mt-1 text-sm text-ink">{order.trackingNumber}</p>
              )}
            </div>
          )}
        </section>

        <section>
          <h2 className="font-display text-xl text-ink">Progress</h2>
          <ol className="mt-3 space-y-3">
            {events.map((event) => (
              <li key={event.id} className="flex gap-3 text-sm">
                <span
                  aria-hidden
                  className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-clay"
                />
                <span>
                  <span className="block text-ink">
                    {EVENT_LABELS[event.type] ?? event.message}
                  </span>
                  <span className="block text-xs text-ink-faint">
                    {longDate(event.createdAt)}
                  </span>
                </span>
              </li>
            ))}
          </ol>

          {order.cancellationReason && (
            <p className="mt-4 rounded-xl bg-clay-tint px-4 py-3 text-sm text-clay">
              {order.cancellationReason}
            </p>
          )}
        </section>
      </div>

      <p className="mt-10 border-t border-line pt-6 text-sm text-ink-soft">
        Something not right? Reply to your confirmation email, or write to{" "}
        <a
          href={`mailto:${site.contact.email}`}
          className="text-clay underline underline-offset-4"
        >
          {site.contact.email}
        </a>
        .
      </p>
    </div>
  );
}
