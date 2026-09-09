import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getCategories,
  isSortKey,
  listProducts,
  type SortKey,
} from "@/lib/catalog";
import { CatalogToolbar } from "./CatalogToolbar";
import { Pagination } from "./Pagination";
import { ProductCard } from "./ProductCard";

export type ShopSearchParams = {
  sort?: string;
  page?: string;
  q?: string;
};

/** Shared body for /shop, /shop/category/[slug] and /search. */
export async function ShopListing({
  categorySlug,
  query,
  searchParams,
  basePath,
}: {
  categorySlug?: string;
  query?: string;
  searchParams: ShopSearchParams;
  basePath: string;
}) {
  const sort: SortKey = isSortKey(searchParams.sort)
    ? searchParams.sort
    : "newest";
  const page = Number.parseInt(searchParams.page ?? "1", 10);

  const [categories, result] = await Promise.all([
    getCategories(),
    listProducts({
      categorySlug,
      query,
      sort,
      page: Number.isFinite(page) ? page : 1,
    }),
  ]);

  // A page past the end would otherwise render an empty grid with a 200,
  // which is a soft 404 — crawlers index it as a real but empty page.
  if (result.page > result.pageCount && result.page > 1) notFound();

  const buildHref = (nextPage: number) => {
    const params = new URLSearchParams();
    if (sort !== "newest") params.set("sort", sort);
    if (query) params.set("q", query);
    if (nextPage > 1) params.set("page", String(nextPage));
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };

  return (
    <>
      <CatalogToolbar
        categories={categories}
        activeCategory={categorySlug}
        sort={sort}
        query={query}
        total={result.total}
        basePath={basePath}
      />

      {result.products.length === 0 ? (
        <div className="py-20 text-center">
          <p className="font-display text-2xl text-ink">
            {query ? `Nothing matches “${query}”` : "Nothing here yet"}
          </p>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-ink-soft">
            {query
              ? "Try a shorter search, or browse the categories above."
              : "New pieces go up as they come out of the studio. The journal is the best place to hear about them first."}
          </p>
          <Link
            href="/shop"
            className="mt-8 inline-flex rounded-full border border-line-strong px-6 py-3 text-sm font-medium text-ink transition-colors hover:bg-paper-sunk"
          >
            Browse everything
          </Link>
        </div>
      ) : (
        <>
          <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-9 sm:gap-x-6 lg:grid-cols-4">
            {result.products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
          <Pagination
            page={result.page}
            pageCount={result.pageCount}
            buildHref={buildHref}
          />
        </>
      )}
    </>
  );
}
