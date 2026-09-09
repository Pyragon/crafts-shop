import Link from "next/link";
import { ArrowIcon } from "./icons";

/**
 * Stand-in for routes that later phases will build out. Keeps every link in
 * the header and footer resolving to a real page so the site can be walked
 * end to end on a phone today.
 */
export function ComingSoon({
  title,
  phase,
  children,
}: {
  title: string;
  phase: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-24 text-center sm:px-6 lg:py-32">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-clay">
        {phase}
      </p>
      <h1 className="mt-4 font-display text-4xl leading-tight text-ink sm:text-5xl">
        {title}
      </h1>
      <div className="mt-5 text-base leading-relaxed text-ink-soft">
        {children ?? <p>This part of the shop is still being built.</p>}
      </div>
      <Link
        href="/"
        className="mt-9 inline-flex items-center gap-2 rounded-full border border-line-strong px-6 py-3 text-sm font-medium text-ink transition-colors hover:bg-paper-sunk"
      >
        <ArrowIcon width={16} height={16} className="rotate-180" />
        Back home
      </Link>
    </div>
  );
}
