import type { Metadata } from "next";
import { ShopListing, type ShopSearchParams } from "@/components/ShopListing";
import { SearchIcon } from "@/components/icons";

export const metadata: Metadata = {
  title: "Search",
  description: "Search the shop.",
  // A search results page is thin, duplicated content; keep it out of the index.
  robots: { index: false, follow: true },
};

export default async function SearchPage({
  searchParams,
}: PageProps<"/search">) {
  const params = (await searchParams) as ShopSearchParams;
  const query = params.q?.trim() ?? "";

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:py-16">
      <header className="mb-8">
        <h1 className="font-display text-4xl text-ink sm:text-5xl">Search</h1>
        <form method="get" action="/search" className="mt-6 flex max-w-lg gap-2">
          <label htmlFor="q" className="sr-only">
            Search products
          </label>
          <div className="relative flex-1">
            <SearchIcon className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-faint" />
            <input
              id="q"
              name="q"
              type="search"
              defaultValue={query}
              placeholder="Mugs, indigo, weaving…"
              className="w-full rounded-full border border-line-strong bg-paper-raised py-3 pl-11 pr-4 text-sm text-ink placeholder:text-ink-faint"
            />
          </div>
          <button
            type="submit"
            className="rounded-full bg-ink px-6 py-3 text-sm font-medium text-paper transition-colors hover:bg-clay"
          >
            Search
          </button>
        </form>
      </header>

      {query ? (
        <ShopListing
          query={query}
          searchParams={params}
          basePath="/search"
        />
      ) : (
        <p className="py-16 text-center text-sm text-ink-soft">
          Type something above to search the shop.
        </p>
      )}
    </div>
  );
}
