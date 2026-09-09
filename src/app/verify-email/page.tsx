import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/AuthForm";
import { verifyEmail } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Confirm your email",
  robots: { index: false, follow: false },
};

export default async function VerifyEmailPage({
  searchParams,
}: PageProps<"/verify-email">) {
  const { token } = (await searchParams) as { token?: string };
  const result = token
    ? await verifyEmail(token)
    : { ok: false as const, error: "This page needs the link from your email." };

  return (
    <AuthShell title={result.ok ? "Email confirmed" : "Couldn't confirm that"}>
      {result.ok ? (
        <>
          <p className="text-base leading-relaxed text-ink-soft">
            Thank you — your address is confirmed. Nothing else to do.
          </p>
          <Link
            href="/account"
            className="mt-7 inline-flex rounded-full bg-clay px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-clay-dark"
          >
            Go to your account
          </Link>
        </>
      ) : (
        <>
          <p className="text-base leading-relaxed text-ink-soft">
            {result.error} Links expire after 48 hours and only work once —
            you can send yourself a fresh one from your account.
          </p>
          <Link
            href="/account"
            className="mt-7 inline-flex rounded-full border border-line-strong px-6 py-3 text-sm font-medium text-ink transition-colors hover:bg-paper-sunk"
          >
            Go to your account
          </Link>
        </>
      )}
    </AuthShell>
  );
}
