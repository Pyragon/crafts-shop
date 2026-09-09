import Link from "next/link";
import { SORTS, type SortKey } from "@/lib/catalog";

type Category = {
  slug: string;
  name: string;
  _count: { products: number };
};

/**
 * Category chips plus a sort control.
 *
 * The sort control is a plain GET form with a submit button, so filtering works
 * with JavaScript disabled and every filtered view has a real, shareable,
 * crawlable URL — which matters given how much of this shop's traffic is meant
 * to arrive from search.
 */
export function CatalogToolbar({
  categories,
  activeCategory,
  sort,
  query,
  total,
  basePath = "/shop",
}: {
  categories: Category[];
  activeCategory?: string;
  sort: SortKey;
  query?: string;
  total: number;
  basePath?: string;
}) {
  const chip = (active: boolean) =>
    `inline-flex shrink-0 items-center gap-1.5 rounded-full border px-4 py-2 text-sm transition-colors ${
      active
        ? "border-clay bg-clay-tint text-clay"
        : "border-line-strong text-ink-soft hover:bg-paper-sunk"
    }`;

  const withParams = (categorySlug?: string) => {
    const params = new URLSearchParams();
    if (sort !== "newest") params.set("sort", sort);
    if (query) params.set("q", query);
    const qs = params.toString();
    const path = categorySlug ? `/shop/category/${categorySlug}` : "/shop";
    return qs ? `${path}?${qs}` : path;
  };

  return (
    <div className="border-b border-line pb-6">
      <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <ul className="flex gap-2">
          <li>
            <Link href={withParams()} className={chip(!activeCategory)}>
              All
            </Link>
          </li>
          {categories.map((c) => (
            <li key={c.slug}>
              <Link
                href={withParams(c.slug)}
                aria-current={activeCategory === c.slug ? "page" : undefined}
                className={chip(activeCategory === c.slug)}
              >
                {c.name}
                <span className="text-xs text-ink-faint">
                  {c._count.products}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-ink-soft" aria-live="polite">
          {total === 0
            ? "No products"
            : `${total} ${total === 1 ? "product" : "products"}`}
        </p>

        <form method="get" action={basePath} className="flex items-center gap-2">
          {query && <input type="hidden" name="q" value={query} />}
          <label htmlFor="sort" className="text-sm text-ink-soft">
            Sort
          </label>
          <select
            id="sort"
            name="sort"
            defaultValue={sort}
            className="rounded-full border border-line-strong bg-paper-raised px-4 py-2 text-sm text-ink"
          >
            {Object.entries(SORTS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="rounded-full border border-line-strong px-4 py-2 text-sm text-ink transition-colors hover:bg-paper-sunk"
          >
            Apply
          </button>
        </form>
      </div>
    </div>
  );
}
