/**
 * Temporary in-memory blog content for Phase 5.
 *
 * Products and categories used to live here too; they now come from the
 * database via `@/lib/catalog`. These posts are the last placeholder left.
 */

export type Post = {
  slug: string;
  title: string;
  excerpt: string;
  publishedAt: string;
  readingMinutes: number;
  tag: string;
};

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

export function recentPosts(limit = 3): Post[] {
  return [...posts]
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
    .slice(0, limit);
}
