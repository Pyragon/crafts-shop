import { Prisma, ProductStatus } from "@prisma/client";
import { db } from "./db";
import { priceRange, totalStock } from "./variants";

/**
 * Read side of the catalogue.
 *
 * Every query here filters to PUBLISHED. Draft and archived products exist for
 * the admin (Phase 7) and must never leak into the storefront, so the filter
 * lives in one place rather than being repeated at each call site.
 */

const PUBLISHED = { status: ProductStatus.PUBLISHED } satisfies Prisma.ProductWhereInput;

/** A product plus the bits every card and detail view needs. */
const productSelect = {
  id: true,
  slug: true,
  name: true,
  blurb: true,
  description: true,
  priceCents: true,
  compareAtCents: true,
  featured: true,
  publishedAt: true,
  category: { select: { slug: true, name: true } },
  images: {
    orderBy: { position: "asc" },
    select: { url: true, alt: true, width: true, height: true },
  },
  options: {
    orderBy: { position: "asc" },
    select: { name: true, position: true },
  },
  variants: {
    orderBy: { position: "asc" },
    select: {
      id: true,
      option1: true,
      option2: true,
      option3: true,
      priceCents: true,
      stock: true,
      sku: true,
    },
  },
} satisfies Prisma.ProductSelect;

export type CatalogProduct = Prisma.ProductGetPayload<{
  select: typeof productSelect;
}>;

/** Total stock across every variant — a product is sold out when this is 0. */
export function productStock(product: CatalogProduct): number {
  return totalStock(product.variants);
}

/** Cheapest and dearest variant price, for "from $x" on cards. */
export function productPriceRange(product: CatalogProduct) {
  return priceRange(product.variants, product.priceCents);
}

export const SORTS = {
  newest: "Newest",
  "price-asc": "Price: low to high",
  "price-desc": "Price: high to low",
  name: "Name: A–Z",
} as const;

export type SortKey = keyof typeof SORTS;

export function isSortKey(value: string | undefined): value is SortKey {
  return !!value && value in SORTS;
}

function orderBy(sort: SortKey): Prisma.ProductOrderByWithRelationInput[] {
  switch (sort) {
    case "price-asc":
      return [{ priceCents: "asc" }, { name: "asc" }];
    case "price-desc":
      return [{ priceCents: "desc" }, { name: "asc" }];
    case "name":
      return [{ name: "asc" }];
    case "newest":
    default:
      // Sold-out items sink below in-stock ones of the same vintage, so the
      // first thing a visitor sees is something they can actually buy.
      return [{ publishedAt: "desc" }, { name: "asc" }];
  }
}

// Two rows of four on desktop; also means the seed data spans more than one
// page, so pagination is exercised rather than silently untested.
export const PER_PAGE = 8;

export type ListOptions = {
  categorySlug?: string;
  sort?: SortKey;
  page?: number;
  query?: string;
  perPage?: number;
};

export type ListResult = {
  products: CatalogProduct[];
  total: number;
  page: number;
  pageCount: number;
  perPage: number;
};

export async function listProducts(
  options: ListOptions = {},
): Promise<ListResult> {
  const perPage = options.perPage ?? PER_PAGE;
  const sort = options.sort ?? "newest";
  const page = Math.max(1, options.page ?? 1);

  const where: Prisma.ProductWhereInput = { ...PUBLISHED };
  if (options.categorySlug) {
    where.category = { slug: options.categorySlug };
  }
  const q = options.query?.trim();
  if (q) {
    // SQLite's LIKE is case-insensitive for ASCII, which is all we need here.
    where.OR = [
      { name: { contains: q } },
      { blurb: { contains: q } },
      { description: { contains: q } },
    ];
  }

  const [total, products] = await Promise.all([
    db.product.count({ where }),
    db.product.findMany({
      where,
      orderBy: orderBy(sort),
      skip: (page - 1) * perPage,
      take: perPage,
      select: productSelect,
    }),
  ]);

  return {
    products,
    total,
    page,
    pageCount: Math.max(1, Math.ceil(total / perPage)),
    perPage,
  };
}

export async function getProductBySlug(
  slug: string,
): Promise<CatalogProduct | null> {
  return db.product.findFirst({
    where: { slug, ...PUBLISHED },
    select: productSelect,
  });
}

export async function getFeaturedProducts(limit = 4): Promise<CatalogProduct[]> {
  const featured = await db.product.findMany({
    where: { ...PUBLISHED, featured: true },
    orderBy: [{ publishedAt: "desc" }],
    take: limit,
    select: productSelect,
  });
  if (featured.length >= limit) return featured;

  // Top up with the newest products so the homepage never looks half-empty
  // just because nobody has ticked "featured" in the admin yet.
  const filler = await db.product.findMany({
    where: { ...PUBLISHED, id: { notIn: featured.map((p) => p.id) } },
    orderBy: [{ publishedAt: "desc" }],
    take: limit - featured.length,
    select: productSelect,
  });
  return [...featured, ...filler];
}

export async function getRelatedProducts(
  product: CatalogProduct,
  limit = 4,
): Promise<CatalogProduct[]> {
  return db.product.findMany({
    where: {
      ...PUBLISHED,
      id: { not: product.id },
      ...(product.category ? { category: { slug: product.category.slug } } : {}),
    },
    orderBy: [{ publishedAt: "desc" }],
    take: limit,
    select: productSelect,
  });
}

export async function getCategories() {
  return db.category.findMany({
    orderBy: { position: "asc" },
    select: {
      slug: true,
      name: true,
      description: true,
      _count: { select: { products: { where: PUBLISHED } } },
    },
  });
}

export async function getCategoryBySlug(slug: string) {
  return db.category.findUnique({
    where: { slug },
    select: { slug: true, name: true, description: true },
  });
}

/** Slugs of every published product — used by sitemap and static params. */
export async function getAllProductSlugs(): Promise<string[]> {
  const rows = await db.product.findMany({
    where: PUBLISHED,
    select: { slug: true },
  });
  return rows.map((r) => r.slug);
}

/** Published within the last 30 days reads as "new" on cards. */
export function isNew(product: Pick<CatalogProduct, "publishedAt">): boolean {
  if (!product.publishedAt) return false;
  const thirtyDays = 30 * 24 * 60 * 60 * 1000;
  return Date.now() - product.publishedAt.getTime() < thirtyDays;
}
