import Image from "next/image";
import Link from "next/link";
import { isNew, type CatalogProduct } from "@/lib/catalog";
import { swatchFor } from "@/lib/swatch";
import { formatPrice } from "@/lib/format";

export function ProductThumb({
  product,
  sizes,
  priority,
}: {
  product: Pick<CatalogProduct, "slug" | "name" | "images">;
  sizes?: string;
  priority?: boolean;
}) {
  const image = product.images[0];
  if (image) {
    return (
      <Image
        src={image.url}
        alt={image.alt}
        fill
        sizes={sizes ?? "(min-width: 1024px) 25vw, 50vw"}
        priority={priority}
        className="object-cover"
      />
    );
  }

  const [from, to] = swatchFor(product.slug);
  return (
    <>
      <div
        aria-hidden
        className="absolute inset-0"
        style={{ background: `linear-gradient(145deg, ${from}, ${to})` }}
      />
      <svg
        aria-hidden
        viewBox="0 0 100 100"
        className="absolute inset-0 h-full w-full text-ink/15"
      >
        <circle cx="50" cy="50" r="26" fill="none" stroke="currentColor" strokeWidth="0.6" />
        <circle cx="50" cy="50" r="34" fill="none" stroke="currentColor" strokeWidth="0.4" />
      </svg>
    </>
  );
}

export function ProductCard({ product }: { product: CatalogProduct }) {
  const soldOut = product.stock === 0;
  const onSale =
    product.compareAtCents !== null &&
    product.compareAtCents > product.priceCents;

  return (
    <article className="group">
      <Link href={`/shop/${product.slug}`} className="block">
        <div className="relative aspect-square overflow-hidden rounded-xl border border-line bg-paper-raised">
          <div className="absolute inset-0 transition-transform duration-500 [transition-timing-function:var(--ease-out-soft)] group-hover:scale-105">
            <ProductThumb product={product} />
          </div>

          {soldOut ? (
            <span className="absolute left-3 top-3 rounded-full bg-ink/85 px-2.5 py-1 text-[11px] font-medium tracking-wide text-paper">
              Sold out
            </span>
          ) : onSale ? (
            <span className="absolute left-3 top-3 rounded-full bg-clay px-2.5 py-1 text-[11px] font-medium tracking-wide text-white">
              Sale
            </span>
          ) : isNew(product) ? (
            <span className="absolute left-3 top-3 rounded-full bg-paper-raised/90 px-2.5 py-1 text-[11px] font-medium tracking-wide text-ink">
              New
            </span>
          ) : null}
        </div>

        <div className="mt-3.5">
          <h3 className="font-display text-lg leading-snug text-ink transition-colors group-hover:text-clay">
            {product.name}
          </h3>
          <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-ink-soft">
            {product.blurb}
          </p>
          <p className="mt-2 flex items-baseline gap-2 text-sm">
            <span className={soldOut ? "text-ink-faint" : "text-ink"}>
              {formatPrice(product.priceCents)}
            </span>
            {onSale && (
              <span className="text-xs text-ink-faint line-through">
                {formatPrice(product.compareAtCents!)}
              </span>
            )}
            {product.stock > 0 && product.stock <= 3 && (
              <span className="text-xs text-clay">
                Only {product.stock} left
              </span>
            )}
          </p>
        </div>
      </Link>
    </article>
  );
}
