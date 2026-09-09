import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/require-auth";
import { getOrdersForUser } from "@/lib/orders";
import { formatPrice } from "@/lib/format";
import { ArrowIcon } from "@/components/icons";

export const metadata: Metadata = {
  title: "Your orders",
  robots: { index: false, follow: false },
};

export default async function OrdersPage() {
  const user = await requireUser("/account/orders");
  // Pending orders are hidden: an abandoned payment attempt is not something a
  // customer should see listed as an order.
  const orders = await getOrdersForUser(user.id);

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:py-16">
      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-ink-faint">
        <Link href="/account" className="transition-colors hover:text-clay">
          Account
        </Link>
        <span aria-hidden> / </span>
        <span className="text-ink-soft">Orders</span>
      </nav>

      <h1 className="font-display text-4xl text-ink sm:text-5xl">Orders</h1>

      {orders.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-line bg-paper-raised p-10 text-center">
          <p className="font-display text-xl text-ink">No orders yet</p>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-ink-soft">
            When you order something it will appear here, with its status and
            tracking.
          </p>
          <Link
            href="/shop"
            className="mt-7 inline-flex items-center gap-2 rounded-full bg-clay px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-clay-dark"
          >
            Browse the shop
            <ArrowIcon width={16} height={16} />
          </Link>
        </div>
      ) : (
        <ul className="mt-10 space-y-4">
          {orders.map((order) => (
            <li
              key={order.id}
              className="rounded-2xl border border-line bg-paper-raised p-6"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <div>
                  <p className="font-display text-lg text-ink">{order.number}</p>
                  <p className="mt-0.5 text-xs text-ink-faint">
                    {order.createdAt.toLocaleDateString("en-CA", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="tabular-nums text-ink">
                    {formatPrice(order.totalCents)}
                  </p>
                  <p className="mt-0.5 text-xs capitalize text-sage">
                    {order.status.toLowerCase()}
                  </p>
                </div>
              </div>

              <ul className="mt-4 space-y-1 border-t border-line pt-4 text-sm text-ink-soft">
                {order.items.map((item) => (
                  <li key={item.id}>
                    {item.quantity} × {item.productName}
                    {item.variantLabel && (
                      <span className="text-ink-faint"> — {item.variantLabel}</span>
                    )}
                    {item.personalisation.map((p) => (
                      <span key={p.id} className="block pl-4 text-xs text-clay">
                        {p.label}: {p.value}
                      </span>
                    ))}
                  </li>
                ))}
              </ul>

              {order.trackingNumber && (
                <p className="mt-4 text-sm text-ink-soft">
                  Tracking: <span className="text-ink">{order.trackingNumber}</span>
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
