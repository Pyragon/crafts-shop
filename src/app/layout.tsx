import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { Fraunces, Inter } from "next/font/google";
import { site } from "@/lib/site";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CartProvider } from "@/components/CartProvider";
import { CartDrawer } from "@/components/CartDrawer";
import { getCart } from "@/lib/cart";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

/**
 * Baseline metadata. Individual pages override `title` and `description`;
 * the template below keeps the shop name in the tab on every page.
 * Phase 6 layers OG images and JSON-LD on top of this.
 */
export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} — ${site.tagline}`,
    template: `%s · ${site.name}`,
  },
  description: site.description,
  applicationName: site.name,
  openGraph: {
    type: "website",
    siteName: site.name,
    title: `${site.name} — ${site.tagline}`,
    description: site.description,
    url: site.url,
  },
  twitter: {
    card: "summary_large_image",
    title: `${site.name} — ${site.tagline}`,
    description: site.description,
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#faf7f2",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // While the site is gated, the coming-soon page stands alone — shop nav and
  // footer would only advertise pages nobody can reach yet. The proxy marks
  // those requests with a header.
  //
  // The env check short-circuits deliberately: once SITE_LOCKED=false,
  // headers() is never called, so pages go back to being statically
  // prerendered instead of forced dynamic.
  const gateEnabled = process.env.SITE_LOCKED !== "false";
  const locked =
    gateEnabled && (await headers()).get("x-site-locked") === "1";

  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        {locked ? (
          <main id="main" className="flex-1">
            {children}
          </main>
        ) : (
          // The cart is only loaded for visitors who can actually shop; a
          // gated visitor shouldn't cost a cart lookup.
          <CartProvider initialCart={await getCart()}>
            <a
              href="#main"
              className="skip-link rounded-full bg-ink px-4 py-2 text-sm text-paper"
            >
              Skip to content
            </a>
            <Header />
            <main id="main" className="flex-1">
              {children}
            </main>
            <Footer />
            <CartDrawer />
          </CartProvider>
        )}
      </body>
    </html>
  );
}
