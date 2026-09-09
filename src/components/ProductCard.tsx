import Link from "next/link";
import type { Product } from "@/lib/placeholder-data";
import { formatPrice } from "@/lib/format";

/**
 * Placeholder artwork stands in until real product photography exists
 * (Phase 7 adds uploads). The gradient is derived from the slug so each
 * product keeps a stable, distinct colour instead of flickering per render.
 */
const swatches = [
  ["#e9d9c6", "#cbb094"],
  ["#dce1d4", "#b3c0a6"],
  ["#f0dcd2", "#d9ab93"],
  ["#dfe2e8", "#b4bcc9"],
  ["#eee2cf", "#d3bd93"],
  ["#e6d7dd", "#c2a2b0"],
];

function swatchFor(slug: string) {
  let hash = 0;
  for (let i = 0; i < slug.length; i++) {
    hash = (hash * 31 + slug.charCodeAt(i)) >>> 0;
  }
  return swatches[hash % swatches.length];
}

export function ProductCard({ product }: { product: Product }) {
  const [from, to] = swatchFor(product.slug);
  const soldOut = product.stock === 0;

  return (
    <article className="group">
      <Link href={`/shop/${product.slug}`} className="block">
        <div className="relative aspect-square overflow-hidden rounded-xl border border-line bg-paper-raised">
          <div
            aria-hidden
            className="absolute inset-0 transition-transform duration-500 [transition-timing-function:var(--ease-out-soft)] group-hover:scale-105"
            style={{ background: `linear-gradient(145deg, ${from}, ${to})` }}
          />
          {/* Placeholder motif so the tile reads as artwork, not a broken image */}
          <svg
            aria-hidden
            viewBox="0 0 100 100"
            className="absolute inset-0 h-full w-full text-ink/15"
          >
            <circle
              cx="50"
              cy="50"
              r="26"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.6"
            />
            <circle
              cx="50"
              cy="50"
              r="34"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.4"
            />
          </svg>

          {product.isNew && !soldOut && (
            <span className="absolute left-3 top-3 rounded-full bg-paper-raised/90 px-2.5 py-1 text-[11px] font-medium tracking-wide text-ink">
              New
            </span>
          )}
          {soldOut && (
            <span className="absolute left-3 top-3 rounded-full bg-ink/85 px-2.5 py-1 text-[11px] font-medium tracking-wide text-paper">
              Sold out
            </span>
          )}
        </div>

        <div className="mt-3.5">
          <h3 className="font-display text-lg leading-snug text-ink transition-colors group-hover:text-clay">
            {product.name}
          </h3>
          <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-ink-soft">
            {product.blurb}
          </p>
          <p
            className={`mt-2 text-sm ${soldOut ? "text-ink-faint line-through" : "text-ink"}`}
          >
            {formatPrice(product.priceCents)}
          </p>
        </div>
      </Link>
    </article>
  );
}
