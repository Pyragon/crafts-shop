import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/require-auth";
import { db } from "@/lib/db";
import { LogoutButton, ProfileForm } from "@/components/AccountForms";
import { VerifyBanner } from "@/components/VerifyBanner";
import { ArrowIcon } from "@/components/icons";

export const metadata: Metadata = {
  title: "Your account",
  robots: { index: false, follow: false },
};

export default async function AccountPage() {
  const user = await requireUser("/account");
  const addressCount = await db.address.count({ where: { userId: user.id } });

  const cards = [
    {
      href: "/account/orders",
      title: "Orders",
      body: "Everything you've bought, and where it is.",
    },
    {
      href: "/account/addresses",
      title: "Addresses",
      body:
        addressCount === 0
          ? "No addresses saved yet."
          : `${addressCount} saved.`,
    },
  ];

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:py-16">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl text-ink sm:text-5xl">
            {user.name ? `Hello, ${user.name}` : "Your account"}
          </h1>
          <p className="mt-2 text-sm text-ink-soft">{user.email}</p>
        </div>
        <LogoutButton />
      </header>

      {!user.emailVerified && <VerifyBanner email={user.email} />}

      <ul className="mt-10 grid gap-4 sm:grid-cols-2">
        {cards.map((card) => (
          <li key={card.href}>
            <Link
              href={card.href}
              className="group flex h-full flex-col rounded-xl border border-line bg-paper-raised p-5 transition-colors hover:border-line-strong"
            >
              <span className="font-display text-xl text-ink transition-colors group-hover:text-clay">
                {card.title}
              </span>
              <span className="mt-1.5 text-sm text-ink-soft">{card.body}</span>
              <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-clay">
                Open
                <ArrowIcon width={14} height={14} />
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <section className="mt-12 border-t border-line pt-10">
        <h2 className="font-display text-2xl text-ink">Details</h2>
        <div className="mt-5 max-w-sm">
          <ProfileForm defaultName={user.name ?? ""} />
        </div>
      </section>
    </div>
  );
}
