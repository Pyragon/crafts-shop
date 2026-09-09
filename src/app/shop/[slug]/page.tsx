import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductCard, ProductThumb } from "@/components/ProductCard";
import { VariantPicker } from "@/components/VariantPicker";
import {
  getAllProductSlugs,
  getProductBySlug,
  getRelatedProducts,
  isNew,
  productPriceRange,
  productStock,
} from "@/lib/catalog";
import { formatPrice } from "@/lib/format";

export async function generateStaticParams() {
  const slugs = await getAllProductSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/shop/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Product not found" };

  return {
    title: product.name,
    description: product.blurb,
    alternates: { canonical: `/shop/${product.slug}` },
    openGraph: {
      type: "website",
      title: product.name,
      description: product.blurb,
      url: `/shop/${product.slug}`,
    },
  };
}

export default async function ProductPage({
  params,
}: PageProps<"/shop/[slug]">) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  // Drafts and archived products resolve to null here, so they 404 rather than
  // being quietly reachable by anyone who guesses the URL.
  if (!product) notFound();

  const related = await getRelatedProducts(product);
  const soldOut = productStock(product) === 0;
  const { min } = productPriceRange(product);
  const onSale = product.compareAtCents !== null && product.compareAtCents > min;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:py-14">
      <nav aria-label="Breadcrumb" className="mb-8 text-sm text-ink-faint">
        <ol className="flex flex-wrap items-center gap-2">
          <li>
            <Link href="/shop" className="transition-colors hover:text-clay">
              Shop
            </Link>
          </li>
          {product.category && (
            <>
              <li aria-hidden>/</li>
              <li>
                <Link
                  href={`/shop/category/${product.category.slug}`}
                  className="transition-colors hover:text-clay"
                >
                  {product.category.name}
                </Link>
              </li>
            </>
          )}
          <li aria-hidden>/</li>
          <li className="text-ink-soft">{product.name}</li>
        </ol>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
        {/* Gallery. One image today; the grid below takes more as soon as
            uploads exist, without a layout change. */}
        <div>
          <div className="relative aspect-square overflow-hidden rounded-2xl border border-line bg-paper-raised">
            <ProductThumb
              product={product}
              sizes="(min-width: 1024px) 50vw, 100vw"
              priority
            />
          </div>
          {product.images.length > 1 && (
            <ul className="mt-3 grid grid-cols-4 gap-3">
              {product.images.slice(1, 5).map((image) => (
                <li
                  key={image.url}
                  className="relative aspect-square overflow-hidden rounded-lg border border-line bg-paper-raised"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={image.url}
                    alt={image.alt}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          {isNew(product) && !soldOut && (
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-clay">
              New this month
            </p>
          )}

          <h1 className="font-display text-4xl leading-tight text-ink sm:text-5xl">
            {product.name}
          </h1>

          <p className="mt-4 text-lg leading-relaxed text-ink-soft">
            {product.blurb}
          </p>

          {onSale && (
            <p className="mt-5 text-sm text-ink-faint">
              Was{" "}
              <span className="line-through">
                {formatPrice(product.compareAtCents!)}
              </span>
            </p>
          )}

          {/* Price, stock and add-to-cart all live in the picker, because all
              three depend on which variant is selected. */}
          <VariantPicker
            options={product.options}
            variants={product.variants}
            basePriceCents={product.priceCents}
          />
          <p className="mt-2 text-xs text-ink-faint">
            Checkout arrives in a later phase; for now this fills the cart.
          </p>

          {product.description && (
            <div className="mt-10 border-t border-line pt-8">
              <h2 className="font-display text-xl text-ink">About this piece</h2>
              <p className="mt-3 whitespace-pre-line text-base leading-relaxed text-ink-soft">
                {product.description}
              </p>
            </div>
          )}

          <dl className="mt-8 grid grid-cols-2 gap-4 border-t border-line pt-8 text-sm">
            {product.category && (
              <div>
                <dt className="text-ink-faint">Category</dt>
                <dd className="mt-1">
                  <Link
                    href={`/shop/category/${product.category.slug}`}
                    className="text-ink transition-colors hover:text-clay"
                  >
                    {product.category.name}
                  </Link>
                </dd>
              </div>
            )}
            <div>
              <dt className="text-ink-faint">Made</dt>
              <dd className="mt-1 text-ink">By hand, in small batches</dd>
            </div>
          </dl>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-20 border-t border-line pt-12 lg:mt-28">
          <h2 className="font-display text-2xl text-ink sm:text-3xl">
            You might also like
          </h2>
          <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-9 sm:gap-x-6 lg:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
