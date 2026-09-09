import Link from "next/link";
import { site } from "@/lib/site";
import { categories, newArrivals, recentPosts } from "@/lib/placeholder-data";
import { formatDate } from "@/lib/format";
import { ProductCard } from "@/components/ProductCard";
import { ArrowIcon } from "@/components/icons";

export default function HomePage() {
  const featured = newArrivals(4);
  const journal = recentPosts(3);

  return (
    <>
      {/* ---------------------------------------------------------------- Hero */}
      <section className="relative overflow-hidden border-b border-line">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-24 h-[28rem] w-[28rem] rounded-full bg-clay-tint blur-3xl sm:-right-16"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-sage-tint blur-3xl"
        />

        <div className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28 lg:py-36">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-clay">
              Small batch · Made by hand
            </p>
            <h1 className="mt-5 font-display text-4xl leading-[1.08] text-ink sm:text-5xl lg:text-6xl">
              Things made slowly,
              <br />
              for a home that is lived in.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-ink-soft sm:text-lg">
              {site.description}
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href="/shop"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-clay px-7 py-3.5 text-sm font-medium text-white transition-colors hover:bg-clay-dark"
              >
                Shop the collection
                <ArrowIcon width={16} height={16} />
              </Link>
              <Link
                href="/about"
                className="inline-flex items-center justify-center rounded-full border border-line-strong px-7 py-3.5 text-sm font-medium text-ink transition-colors hover:bg-paper-sunk"
              >
                Meet the maker
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------- Categories */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
        <h2 className="sr-only">Shop by category</h2>
        <ul className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {categories.map((c) => (
            <li key={c.slug}>
              <Link
                href={`/shop/category/${c.slug}`}
                className="group flex h-full flex-col rounded-xl border border-line bg-paper-raised p-5 transition-colors hover:border-line-strong sm:p-6"
              >
                <span className="font-display text-lg text-ink transition-colors group-hover:text-clay sm:text-xl">
                  {c.name}
                </span>
                <span className="mt-1.5 text-sm leading-relaxed text-ink-soft">
                  {c.description}
                </span>
                <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-clay">
                  Browse
                  <ArrowIcon
                    width={14}
                    height={14}
                    className="transition-transform group-hover:translate-x-0.5"
                  />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* -------------------------------------------------------- New arrivals */}
      <section className="mx-auto max-w-6xl px-4 py-4 sm:px-6 lg:py-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-3xl text-ink sm:text-4xl">
              New this month
            </h2>
            <p className="mt-2 text-sm text-ink-soft">
              Fresh out of the studio, usually in very small numbers.
            </p>
          </div>
          <Link
            href="/shop"
            className="hidden shrink-0 items-center gap-1.5 text-sm font-medium text-clay hover:text-clay-dark sm:inline-flex"
          >
            View all
            <ArrowIcon width={15} height={15} />
          </Link>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-9 sm:gap-x-6 lg:grid-cols-4">
          {featured.map((p) => (
            <ProductCard key={p.slug} product={p} />
          ))}
        </div>

        <Link
          href="/shop"
          className="mt-10 inline-flex w-full items-center justify-center gap-2 rounded-full border border-line-strong px-6 py-3 text-sm font-medium text-ink sm:hidden"
        >
          View all products
          <ArrowIcon width={16} height={16} />
        </Link>
      </section>

      {/* --------------------------------------------------------------- Story */}
      <section className="mt-16 border-y border-line bg-paper-sunk lg:mt-24">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:items-center lg:gap-16 lg:py-24">
          <div
            aria-hidden
            className="aspect-[4/3] rounded-xl border border-line bg-[linear-gradient(140deg,#e9d9c6,#c3ad92)] lg:aspect-square"
          />
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-clay">
              The studio
            </p>
            <h2 className="mt-4 font-display text-3xl leading-tight text-ink sm:text-4xl">
              One pair of hands, a small kiln, and no particular hurry.
            </h2>
            <p className="mt-5 text-base leading-relaxed text-ink-soft">
              Everything here is made in a converted garage studio. Batches are
              small because they have to be — a kiln load is a kiln load, and
              some of it comes out wrong. What survives goes on the shelf.
            </p>
            <p className="mt-4 text-base leading-relaxed text-ink-soft">
              If a piece is sold out, it usually means the next firing is a few
              weeks away. The journal is the best place to hear when it lands.
            </p>
            <Link
              href="/about"
              className="mt-8 inline-flex items-center gap-2 text-sm font-medium text-clay hover:text-clay-dark"
            >
              Read the full story
              <ArrowIcon width={15} height={15} />
            </Link>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- Journal */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-3xl text-ink sm:text-4xl">
              From the journal
            </h2>
            <p className="mt-2 text-sm text-ink-soft">
              Notes on making, and the occasional how-to.
            </p>
          </div>
          <Link
            href="/blog"
            className="hidden shrink-0 items-center gap-1.5 text-sm font-medium text-clay hover:text-clay-dark sm:inline-flex"
          >
            All posts
            <ArrowIcon width={15} height={15} />
          </Link>
        </div>

        <ul className="mt-8 grid gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
          {journal.map((post) => (
            <li key={post.slug}>
              <article className="group flex h-full flex-col">
                <Link href={`/blog/${post.slug}`} className="flex h-full flex-col">
                  <div
                    aria-hidden
                    className="aspect-[16/10] rounded-xl border border-line bg-[linear-gradient(140deg,#dce1d4,#aebba1)] transition-transform duration-500 [transition-timing-function:var(--ease-out-soft)] group-hover:scale-[1.02]"
                  />
                  <p className="mt-4 flex items-center gap-2 text-xs text-ink-faint">
                    <span className="rounded-full bg-sage-tint px-2.5 py-1 font-medium text-sage">
                      {post.tag}
                    </span>
                    <time dateTime={post.publishedAt}>
                      {formatDate(post.publishedAt)}
                    </time>
                  </p>
                  <h3 className="mt-3 font-display text-xl leading-snug text-ink transition-colors group-hover:text-clay">
                    {post.title}
                  </h3>
                  <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-ink-soft">
                    {post.excerpt}
                  </p>
                  <span className="mt-3 text-xs text-ink-faint">
                    {post.readingMinutes} min read
                  </span>
                </Link>
              </article>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
