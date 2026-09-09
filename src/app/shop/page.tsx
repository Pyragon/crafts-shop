import type { Metadata } from "next";
import { ShopListing, type ShopSearchParams } from "@/components/ShopListing";

export const metadata: Metadata = {
  title: "Shop",
  description:
    "Hand-thrown ceramics, naturally dyed textiles, paper goods and craft kits — all made in small batches by hand.",
};

export default async function ShopPage({
  searchParams,
}: PageProps<"/shop">) {
  const params = (await searchParams) as ShopSearchParams;

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:py-16">
      <header className="mb-8">
        <h1 className="font-display text-4xl text-ink sm:text-5xl">Shop</h1>
        <p className="mt-3 max-w-xl text-base leading-relaxed text-ink-soft">
          Everything currently available. Batches are small, so what is here is
          genuinely what there is.
        </p>
      </header>
      <ShopListing searchParams={params} basePath="/shop" />
    </div>
  );
}
