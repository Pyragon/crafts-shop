import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/require-auth";
import { ArrowIcon } from "@/components/icons";

export const metadata: Metadata = {
  title: "Your orders",
  robots: { index: false, follow: false },
};

export default async function OrdersPage() {
  await requireUser("/account/orders");

  // Orders arrive with checkout in Phase 4. The page exists now so the account
  // area is navigable and the empty state is the one people will actually see
  // first — most accounts have no orders on day one.
  const orders: { id: string; number: string }[] = [];

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
      ) : null}
    </div>
  );
}
