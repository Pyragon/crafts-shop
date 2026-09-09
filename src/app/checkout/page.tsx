import type { Metadata } from "next";
import Link from "next/link";
import { CheckoutForm } from "@/components/CheckoutForm";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false, follow: false },
};

export default async function CheckoutPage() {
  // Guest checkout is deliberate: requiring an account to buy costs sales, and
  // an account can be created afterwards from the same email.
  const user = await getCurrentUser();

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:py-16">
      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-ink-faint">
        <Link href="/cart" className="transition-colors hover:text-clay">
          Cart
        </Link>
        <span aria-hidden> / </span>
        <span className="text-ink-soft">Checkout</span>
      </nav>

      <h1 className="mb-8 font-display text-4xl text-ink sm:text-5xl">Checkout</h1>

      <CheckoutForm
        publishableKey={process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? null}
        defaultEmail={user?.email ?? ""}
      />
    </div>
  );
}
