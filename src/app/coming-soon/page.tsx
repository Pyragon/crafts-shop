import type { Metadata } from "next";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  // absolute: the root layout's "%s · <shop>" template would double the name.
  title: { absolute: `${site.name} — Coming soon` },
  description: `${site.name} is opening soon. ${site.description}`,
  robots: { index: false, follow: false },
};

export default function ComingSoonPage() {
  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-6 py-20 text-center">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-32 -top-32 h-[30rem] w-[30rem] rounded-full bg-clay-tint blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-40 -left-32 h-96 w-96 rounded-full bg-sage-tint blur-3xl"
      />

      <div className="relative w-full max-w-xl">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-clay">
          Opening soon
        </p>

        <h1 className="mt-6 font-display text-5xl leading-[1.05] text-ink sm:text-6xl">
          {site.name}
        </h1>

        <p className="mt-6 text-lg leading-relaxed text-ink-soft">
          {site.tagline}.
        </p>

        <hr className="mx-auto my-10 w-16 border-line-strong" />

        <p className="mx-auto max-w-md text-base leading-relaxed text-ink-soft">
          The shop is being built right now — hand-thrown ceramics, naturally
          dyed textiles and paper goods, all made in small batches. Leave your
          email and you&apos;ll hear the moment the first pieces go up.
        </p>

        <form className="mx-auto mt-8 flex w-full max-w-md flex-col gap-3 sm:flex-row">
          <label htmlFor="notify-email" className="sr-only">
            Email address
          </label>
          <input
            id="notify-email"
            name="email"
            type="email"
            required
            placeholder="you@example.com"
            className="min-w-0 flex-1 rounded-full border border-line-strong bg-paper-raised px-5 py-3 text-sm text-ink placeholder:text-ink-faint"
          />
          <button
            type="submit"
            className="rounded-full bg-clay px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-clay-dark"
          >
            Notify me
          </button>
        </form>

        <p className="mt-12 text-sm text-ink-faint">
          Questions?{" "}
          <a
            href={`mailto:${site.contact.email}`}
            className="text-ink-soft underline underline-offset-4 transition-colors hover:text-clay"
          >
            {site.contact.email}
          </a>
        </p>
      </div>
    </div>
  );
}
