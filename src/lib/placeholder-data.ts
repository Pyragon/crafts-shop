/**
 * Temporary in-memory content for Phase 0.
 *
 * The shapes here deliberately mirror the planned Prisma schema so that
 * Phase 1 can swap these arrays for real database queries without touching
 * the components that consume them.
 */

export type Category = {
  slug: string;
  name: string;
  description: string;
};

export type Product = {
  slug: string;
  name: string;
  /** integer cents */
  priceCents: number;
  categorySlug: string;
  blurb: string;
  stock: number;
  isNew: boolean;
};

export type Post = {
  slug: string;
  title: string;
  excerpt: string;
  publishedAt: string;
  readingMinutes: number;
  tag: string;
};

export const categories: Category[] = [
  {
    slug: "ceramics",
    name: "Ceramics",
    description: "Hand-thrown stoneware, glazed in small test batches.",
  },
  {
    slug: "textiles",
    name: "Textiles",
    description: "Naturally dyed linen and cotton, woven and stitched by hand.",
  },
  {
    slug: "paper",
    name: "Paper Goods",
    description: "Letterpress cards, bound notebooks and marbled sheets.",
  },
  {
    slug: "kits",
    name: "Craft Kits",
    description: "Everything you need to make it yourself, at your own pace.",
  },
];

export const products: Product[] = [
  {
    slug: "speckled-stoneware-mug",
    name: "Speckled Stoneware Mug",
    priceCents: 3200,
    categorySlug: "ceramics",
    blurb: "Thrown on the wheel and glazed in a soft oatmeal speckle.",
    stock: 12,
    isNew: true,
  },
  {
    slug: "indigo-dyed-linen-napkins",
    name: "Indigo Dyed Linen Napkins",
    priceCents: 4800,
    categorySlug: "textiles",
    blurb: "A set of four, dipped in a living indigo vat. No two alike.",
    stock: 6,
    isNew: true,
  },
  {
    slug: "marbled-notebook",
    name: "Marbled Notebook",
    priceCents: 2400,
    categorySlug: "paper",
    blurb: "Hand-marbled cover, coptic bound, 120 pages of cream stock.",
    stock: 20,
    isNew: true,
  },
  {
    slug: "beginners-weaving-kit",
    name: "Beginner's Weaving Kit",
    priceCents: 6500,
    categorySlug: "kits",
    blurb: "Frame loom, three yarns, a shuttle, and a very patient guide.",
    stock: 9,
    isNew: true,
  },
  {
    slug: "ash-glaze-bud-vase",
    name: "Ash Glaze Bud Vase",
    priceCents: 3800,
    categorySlug: "ceramics",
    blurb: "Small enough for one stem, heavy enough to hold its ground.",
    stock: 4,
    isNew: false,
  },
  {
    slug: "block-printed-tea-towel",
    name: "Block Printed Tea Towel",
    priceCents: 2600,
    categorySlug: "textiles",
    blurb: "Carved lino, pressed by hand onto washed cotton.",
    stock: 15,
    isNew: false,
  },
  {
    slug: "letterpress-card-set",
    name: "Letterpress Card Set",
    priceCents: 1800,
    categorySlug: "paper",
    blurb: "Six blank cards, deeply impressed on cotton rag paper.",
    stock: 30,
    isNew: false,
  },
  {
    slug: "candle-making-kit",
    name: "Candle Making Kit",
    priceCents: 5200,
    categorySlug: "kits",
    blurb: "Soy wax, cotton wicks, two reusable tins and three scents.",
    stock: 0,
    isNew: false,
  },
];

export const posts: Post[] = [
  {
    slug: "what-slow-making-actually-means",
    title: "What slow making actually means",
    excerpt:
      "Everyone says handmade. Fewer people say how long the glaze takes to settle, or what happens when a kiln load goes wrong.",
    publishedAt: "2026-08-24",
    readingMinutes: 6,
    tag: "Studio notes",
  },
  {
    slug: "a-beginners-guide-to-natural-dye",
    title: "A beginner's guide to natural dye",
    excerpt:
      "Onion skins, avocado pits and a stock pot you never plan to cook in again. Start here before you buy anything.",
    publishedAt: "2026-08-11",
    readingMinutes: 9,
    tag: "How-to",
  },
  {
    slug: "five-tools-worth-the-money",
    title: "Five tools that are worth the money",
    excerpt:
      "Most craft tools can be improvised. These five cannot, and buying cheap versions costs more in the end.",
    publishedAt: "2026-07-29",
    readingMinutes: 5,
    tag: "How-to",
  },
];

export function getCategory(slug: string): Category | undefined {
  return categories.find((c) => c.slug === slug);
}

export function newArrivals(limit = 4): Product[] {
  return products.filter((p) => p.isNew).slice(0, limit);
}

export function recentPosts(limit = 3): Post[] {
  return [...posts]
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
    .slice(0, limit);
}
