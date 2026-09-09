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
          {/* Flex row rather than an icon absolutely positioned over a padded
              input. The overlaid version rendered wrong on a real device
              (Brave/Android) while measuring perfectly in headless Chromium,
              and the cause was never pinned down — a Cloudflare caching fix
              landed at the same time, so either could have been to blame.
              This version doesn't depend on the answer: no overlay to
              misplace, no padding for native `type="search"` styling to
              override, and appearance-none strips the native chrome. */}
          <div className="flex flex-1 items-center gap-3 rounded-full border border-line-strong bg-paper-raised px-4 focus-within:border-clay">
            <SearchIcon className="shrink-0 text-ink-faint" />
            <input
              id="q"
              name="q"
              type="search"
              defaultValue={query}
              placeholder="Mugs, indigo, weaving…"
              className="w-full appearance-none border-0 bg-transparent py-3 text-sm text-ink outline-none placeholder:text-ink-faint [&::-webkit-search-cancel-button]:appearance-none"
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
