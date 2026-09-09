import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/require-auth";
import { db } from "@/lib/db";

export const metadata: Metadata = {
  title: "Your addresses",
  robots: { index: false, follow: false },
};

export default async function AddressesPage() {
  const user = await requireUser("/account/addresses");
  const addresses = await db.address.findMany({
    where: { userId: user.id },
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:py-16">
      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-ink-faint">
        <Link href="/account" className="transition-colors hover:text-clay">
          Account
        </Link>
        <span aria-hidden> / </span>
        <span className="text-ink-soft">Addresses</span>
      </nav>

      <h1 className="font-display text-4xl text-ink sm:text-5xl">Addresses</h1>

      {addresses.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-line bg-paper-raised p-10 text-center">
          <p className="font-display text-xl text-ink">No addresses saved</p>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-ink-soft">
            The address you use at checkout will be offered for saving, so the
            next order is quicker.
          </p>
        </div>
      ) : (
        <ul className="mt-10 grid gap-4 sm:grid-cols-2">
          {addresses.map((address) => (
            <li
              key={address.id}
              className="rounded-xl border border-line bg-paper-raised p-5"
            >
              {address.label && (
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-ink-faint">
                  {address.label}
                  {address.isDefault && (
                    <span className="ml-2 text-clay">Default</span>
                  )}
                </p>
              )}
              <address className="mt-2 not-italic text-sm leading-relaxed text-ink-soft">
                {address.name}
                <br />
                {address.line1}
                {address.line2 && (
                  <>
                    <br />
                    {address.line2}
                  </>
                )}
                <br />
                {address.city}
                {address.region ? `, ${address.region}` : ""} {address.postalCode}
                <br />
                {address.country}
              </address>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
