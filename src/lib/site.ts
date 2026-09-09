/**
 * Single source of truth for branding. Change a value here and it updates
 * everywhere — page titles, OG tags, header, footer, and later, emails.
 */
export const site = {
  name: "MaBrown's Creations",
  shortName: "MaBrown's",
  tagline: "Handmade with patience, sold with joy",
  description:
    "A small-batch arts and crafts studio. Hand-thrown ceramics, naturally dyed textiles, and paper goods made slowly, in small numbers, by hand.",

  // Used for canonical URLs, sitemap and OG tags. Update when the domain is live.
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",

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
