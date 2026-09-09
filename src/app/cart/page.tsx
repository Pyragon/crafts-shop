import type { Metadata } from "next";
import { CartPageContents } from "@/components/CartPageContents";

export const metadata: Metadata = {
  title: "Cart",
  description: "Your cart.",
  // A personal, per-visitor page — nothing for a crawler to index.
  robots: { index: false, follow: false },
};

export default function CartPage() {
  // Contents come from the cart context, which the layout seeds with
  // server-loaded data — so the first paint is already correct rather than
  // flashing an empty cart while the client catches up.
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:py-16">
      <h1 className="mb-8 font-display text-4xl text-ink sm:text-5xl">Cart</h1>
      <CartPageContents />
    </div>
  );
}
