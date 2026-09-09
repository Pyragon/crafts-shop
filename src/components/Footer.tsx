import Link from "next/link";
import { site } from "@/lib/site";
import { getCategories } from "@/lib/catalog";
import { ArrowIcon } from "./icons";

export async function Footer() {
  const categories = await getCategories();
  return (
    <footer className="mt-24 border-t border-line bg-paper-sunk">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:py-20">
        {/* Newsletter — wired up in a later phase */}
        <div className="mb-14 grid gap-6 border-b border-line pb-14 lg:grid-cols-2 lg:items-end lg:gap-12">
          <div>
            <h2 className="font-display text-2xl text-ink sm:text-3xl">
              Letters from the studio
            </h2>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-ink-soft">
              New pieces, restocks and the occasional honest note about what
              went wrong in the kiln. Once a month, never more.
            </p>
          </div>
          <form
            className="flex w-full flex-col gap-3 sm:flex-row"
            // TODO(Phase 5): wire to a real mailing list provider
          >
            <label htmlFor="newsletter-email" className="sr-only">
              Email address
            </label>
            <input
              id="newsletter-email"
              type="email"
              required
              placeholder="you@example.com"
              className="min-w-0 flex-1 rounded-full border border-line-strong bg-paper-raised px-5 py-3 text-sm text-ink placeholder:text-ink-faint"
            />
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-ink px-6 py-3 text-sm font-medium text-paper transition-colors hover:bg-clay"
            >
              Subscribe
              <ArrowIcon width={16} height={16} />
            </button>
          </form>
        </div>

        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2 lg:col-span-1">
            <p className="font-display text-xl text-ink">{site.name}</p>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-ink-soft">
              {site.description}
            </p>
          </div>

          <nav aria-labelledby="footer-shop">
            <h3
              id="footer-shop"
              className="text-xs font-semibold uppercase tracking-widest text-ink-faint"
            >
              Shop
            </h3>
            <ul className="mt-4 space-y-2.5">
              {categories.map((c) => (
                <li key={c.slug}>
                  <Link
                    href={`/shop/category/${c.slug}`}
                    className="text-sm text-ink-soft transition-colors hover:text-clay"
                  >
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-labelledby="footer-help">
            <h3
              id="footer-help"
              className="text-xs font-semibold uppercase tracking-widest text-ink-faint"
            >
              Help
            </h3>
            <ul className="mt-4 space-y-2.5">
              {[
                { label: "Shipping", href: "/shipping" },
                { label: "Returns", href: "/returns" },
                { label: "Contact", href: "/contact" },
                { label: "Account", href: "/account" },
              ].map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-sm text-ink-soft transition-colors hover:text-clay"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-labelledby="footer-elsewhere">
            <h3
              id="footer-elsewhere"
              className="text-xs font-semibold uppercase tracking-widest text-ink-faint"
            >
              Elsewhere
            </h3>
            <ul className="mt-4 space-y-2.5">
              {site.socials.map((s) => (
                <li key={s.label}>
                  <a
                    href={s.href}
                    rel="noopener noreferrer me"
                    target="_blank"
                    className="text-sm text-ink-soft transition-colors hover:text-clay"
                  >
                    {s.label}
                  </a>
                </li>
              ))}
              <li>
                <a
                  href={`mailto:${site.contact.email}`}
                  className="text-sm text-ink-soft transition-colors hover:text-clay"
                >
                  {site.contact.email}
                </a>
              </li>
            </ul>
          </nav>
        </div>

        <div className="mt-14 flex flex-col gap-3 border-t border-line pt-8 text-xs text-ink-faint sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {site.name}. All rights reserved.
          </p>
          <ul className="flex gap-5">
            <li>
              <Link href="/privacy" className="transition-colors hover:text-clay">
                Privacy
              </Link>
            </li>
            <li>
              <Link href="/terms" className="transition-colors hover:text-clay">
                Terms
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
