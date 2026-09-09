"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { site } from "@/lib/site";
import { CartIcon, CloseIcon, MenuIcon, SearchIcon, UserIcon } from "./icons";
import { useCart } from "./CartProvider";

export function Header({ signedIn = false }: { signedIn?: boolean }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const panelRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  const { cart, open: openCart } = useCart();
  const cartCount = cart.count;

  // Close the drawer whenever navigation happens. Adjusting state during
  // render (rather than in an effect) is React's recommended pattern here —
  // it avoids the extra render pass a setState-in-effect would cause, and it
  // catches back/forward navigation too, not just link clicks.
  const [lastPathname, setLastPathname] = useState(pathname);
  if (lastPathname !== pathname) {
    setLastPathname(pathname);
    setOpen(false);
  }

  // Lock body scroll and wire up Escape while the drawer is open.
  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        toggleRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);

    // Move focus into the drawer so keyboard and screen reader users land there.
    panelRef.current?.querySelector<HTMLElement>("a, button")?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  return (
    <>
      <div className="bg-ink px-4 py-2 text-center text-xs tracking-wide text-paper">
        Free shipping on orders over $75 · Every piece made by hand
      </div>

      <header className="sticky top-0 z-40 border-b border-line bg-paper/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:px-6 lg:h-20">
          {/* Mobile: menu toggle sits first so the logo can stay centred-left */}
          <button
            ref={toggleRef}
            type="button"
            onClick={() => setOpen(true)}
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label="Open menu"
            className="-ml-2 rounded-full p-2 text-ink transition-colors hover:bg-paper-sunk lg:hidden"
          >
            <MenuIcon width={22} height={22} />
          </button>

          <Link
            href="/"
            className="mr-auto font-display text-xl leading-none tracking-tight text-ink sm:text-2xl"
          >
            {site.name}
          </Link>

          <nav aria-label="Main" className="hidden lg:block">
            <ul className="flex items-center gap-8">
              {site.nav.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={isActive(item.href) ? "page" : undefined}
                    className={`relative text-sm transition-colors hover:text-clay ${
                      isActive(item.href) ? "text-clay" : "text-ink-soft"
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="ml-auto flex items-center gap-1 lg:ml-6">
            <Link
              href="/search"
              aria-label="Search"
              className="rounded-full p-2 text-ink transition-colors hover:bg-paper-sunk"
            >
              <SearchIcon />
            </Link>
            <Link
              href={signedIn ? "/account" : "/login"}
              aria-label={signedIn ? "Your account" : "Sign in"}
              className="relative rounded-full p-2 text-ink transition-colors hover:bg-paper-sunk"
            >
              <UserIcon />
              {signedIn && (
                <span
                  aria-hidden
                  className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-sage"
                />
              )}
            </Link>
            {/* Still a real link, so it works without JavaScript; with JS the
                click is intercepted to open the drawer instead. */}
            <Link
              href="/cart"
              onClick={(e) => {
                e.preventDefault();
                openCart();
              }}
              aria-label={`Cart, ${cartCount} ${cartCount === 1 ? "item" : "items"}`}
              className="relative rounded-full p-2 text-ink transition-colors hover:bg-paper-sunk"
            >
              <CartIcon />
              {cartCount > 0 && (
                <span className="absolute right-0.5 top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-clay px-1 text-[10px] font-medium text-white">
                  {cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      {/* Inline styles for the open/closed state — see CartDrawer for why. */}
      <div
        className="fixed inset-0 z-50 lg:hidden"
        style={{ pointerEvents: open ? "auto" : "none" }}
        aria-hidden={!open}
        inert={!open}
      >
        <button
          type="button"
          tabIndex={-1}
          aria-label="Close menu"
          onClick={() => setOpen(false)}
          className="absolute inset-0 bg-ink/40 transition-opacity duration-300"
          style={{ opacity: open ? 1 : 0 }}
        />
        <div
          ref={panelRef}
          id="mobile-nav"
          role="dialog"
          aria-modal={open}
          aria-label="Site menu"
          className="absolute inset-y-0 left-0 flex w-[min(20rem,85vw)] flex-col bg-paper shadow-2xl transition-transform duration-300 [transition-timing-function:var(--ease-out-soft)]"
          style={{ transform: open ? "translateX(0)" : "translateX(-100%)" }}
        >
          <div className="flex h-16 items-center justify-between border-b border-line px-5">
            <span className="font-display text-lg text-ink">{site.name}</span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close menu"
              className="-mr-2 rounded-full p-2 text-ink transition-colors hover:bg-paper-sunk"
            >
              <CloseIcon width={22} height={22} />
            </button>
          </div>

          <nav aria-label="Mobile" className="flex-1 overflow-y-auto px-5 py-6">
            <ul className="space-y-1">
              {site.nav.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={isActive(item.href) ? "page" : undefined}
                    className={`block rounded-lg px-3 py-3 font-display text-2xl transition-colors ${
                      isActive(item.href)
                        ? "bg-clay-tint text-clay"
                        : "text-ink hover:bg-paper-sunk"
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>

            <hr className="my-6 border-line" />

            <ul className="space-y-1">
              <li>
                <Link
                  href={signedIn ? "/account" : "/login"}
                  className="block rounded-lg px-3 py-2.5 text-sm text-ink-soft hover:bg-paper-sunk"
                >
                  {signedIn ? "Account & orders" : "Sign in"}
                </Link>
              </li>
              <li>
                <Link
                  href="/cart"
                  className="block rounded-lg px-3 py-2.5 text-sm text-ink-soft hover:bg-paper-sunk"
                >
                  Cart
                </Link>
              </li>
            </ul>
          </nav>

          <div className="border-t border-line px-5 py-5">
            <p className="text-xs text-ink-faint">{site.tagline}</p>
          </div>
        </div>
      </div>
    </>
  );
}
