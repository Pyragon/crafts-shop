import Link from "next/link";

/** Page links, rendered as real anchors so they can be crawled and shared. */
export function Pagination({
  page,
  pageCount,
  buildHref,
}: {
  page: number;
  pageCount: number;
  buildHref: (page: number) => string;
}) {
  if (pageCount <= 1) return null;

  const pages = Array.from({ length: pageCount }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === pageCount || Math.abs(p - page) <= 1,
  );

  const cls = (active: boolean) =>
    `inline-flex h-10 min-w-10 items-center justify-center rounded-full border px-3 text-sm transition-colors ${
      active
        ? "border-clay bg-clay-tint text-clay"
        : "border-line-strong text-ink-soft hover:bg-paper-sunk"
    }`;

  return (
    <nav aria-label="Pagination" className="mt-12 flex justify-center">
      <ul className="flex flex-wrap items-center gap-2">
        {page > 1 && (
          <li>
            <Link href={buildHref(page - 1)} rel="prev" className={cls(false)}>
              Previous
            </Link>
          </li>
        )}
        {pages.map((p, i) => {
          const gap = i > 0 && p - pages[i - 1] > 1;
          return (
            <li key={p} className="flex items-center gap-2">
              {gap && <span className="text-ink-faint">…</span>}
              <Link
                href={buildHref(p)}
                aria-current={p === page ? "page" : undefined}
                className={cls(p === page)}
              >
                {p}
              </Link>
            </li>
          );
        })}
        {page < pageCount && (
          <li>
            <Link href={buildHref(page + 1)} rel="next" className={cls(false)}>
              Next
            </Link>
          </li>
        )}
      </ul>
    </nav>
  );
}
