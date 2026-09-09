/**
 * Single source of truth for branding. Change a value here and it updates
 * everywhere — page titles, OG tags, header, footer, and later, emails.
 */
function siteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (configured) return configured.replace(/\/$/, "");

  if (process.env.NODE_ENV === "production") {
    console.warn(
      "[site] NEXT_PUBLIC_SITE_URL is not set. Canonical URLs, OG tags and " +
        "email links will point at localhost.",
    );
  }
  return "http://localhost:3000";
}

export const site = {
  name: "MaBrown's Creations",
  shortName: "MaBrown's",
  tagline: "Handmade with patience, sold with joy",
  description:
    "A small-batch arts and crafts studio. Hand-thrown ceramics, naturally dyed textiles, and paper goods made slowly, in small numbers, by hand.",

  // Canonical URLs, OG tags, sitemap, and every link inside an email.
  //
  // The localhost fallback is for a bare local checkout only. If it is ever
  // serving real traffic, canonical tags point search engines at an
  // unreachable host and reset links point at the visitor's own machine — so
  // it complains rather than failing quietly.
  url: siteUrl(),

  contact: {
    email: "hello@example.com",
    phone: "",
    address: "",
  },

  socials: [
    { label: "Instagram", href: "https://instagram.com/" },
    { label: "Pinterest", href: "https://pinterest.com/" },
    { label: "Etsy", href: "https://etsy.com/" },
  ],

  nav: [
    { label: "Shop", href: "/shop" },
    { label: "Journal", href: "/blog" },
    { label: "About", href: "/about" },
    { label: "Contact", href: "/contact" },
  ],
} as const;
