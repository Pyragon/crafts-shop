import "dotenv/config";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient, ProductStatus } from "@prisma/client";

const db = new PrismaClient({
  adapter: new PrismaBetterSqlite3({ url: process.env.DATABASE_URL! }),
});

const categories = [
  {
    slug: "ceramics",
    name: "Ceramics",
    description: "Hand-thrown stoneware, glazed in small test batches.",
    position: 0,
  },
  {
    slug: "textiles",
    name: "Textiles",
    description: "Naturally dyed linen and cotton, woven and stitched by hand.",
    position: 1,
  },
  {
    slug: "paper",
    name: "Paper Goods",
    description: "Letterpress cards, bound notebooks and marbled sheets.",
    position: 2,
  },
  {
    slug: "kits",
    name: "Craft Kits",
    description: "Everything you need to make it yourself, at your own pace.",
    position: 3,
  },
];

/** One axis of variation, e.g. { name: "Colour", values: ["Indigo", "Madder"] }. */
type SeedOption = { name: string; values: string[] };

/** Stock (and optional price bump) for one combination of option values. */
type SeedVariant = {
  options: string[];
  stock: number;
  /// Absolute price for this variant; omitted means the product's base price.
  priceCents?: number;
  sku?: string;
};

type SeedProduct = {
  slug: string;
  name: string;
  blurb: string;
  description: string;
  priceCents: number;
  compareAtCents?: number;
  sku: string;
  /// Stock when the product has no options — becomes its single default variant.
  stock?: number;
  options?: SeedOption[];
  variants?: SeedVariant[];
  category: string;
  featured?: boolean;
  status?: ProductStatus;
  /** days ago */
  published?: number;
};

const products: SeedProduct[] = [
  {
    slug: "speckled-stoneware-mug",
    name: "Speckled Stoneware Mug",
    blurb: "Thrown on the wheel and glazed in a soft oatmeal speckle.",
    description:
      "A generous everyday mug, thrown in stoneware and finished with a speckled oatmeal glaze that pools a little where the wall meets the base. Holds around 350ml. The handle is pulled by hand, so no two sit exactly alike. Dishwasher and microwave safe, though it will thank you for a gentler life.",
    priceCents: 3200,
    sku: "CER-MUG-01",
    category: "ceramics",
    options: [
      { name: "Glaze", values: ["Oatmeal", "Ash"] },
      { name: "Size", values: ["Standard", "Large"] },
    ],
    variants: [
      { options: ["Oatmeal", "Standard"], stock: 5, sku: "CER-MUG-01-OS" },
      { options: ["Oatmeal", "Large"], stock: 3, priceCents: 3800, sku: "CER-MUG-01-OL" },
      { options: ["Ash", "Standard"], stock: 4, sku: "CER-MUG-01-AS" },
      { options: ["Ash", "Large"], stock: 0, priceCents: 3800, sku: "CER-MUG-01-AL" },
    ],
    featured: true,
    published: 6,
  },
  {
    slug: "ash-glaze-bud-vase",
    name: "Ash Glaze Bud Vase",
    blurb: "Small enough for one stem, heavy enough to hold its ground.",
    description:
      "A short, weighty bud vase finished in a wood-ash glaze that breaks from olive to warm buff over the shoulder. Made for a single stem — a cutting from the garden, a sprig of something dried. Roughly 11cm tall. Watertight, but a small pool on the base is normal after long standing.",
    priceCents: 3800,
    sku: "CER-VAS-01",
    stock: 4,
    category: "ceramics",
    published: 40,
  },
  {
    slug: "wide-serving-bowl",
    name: "Wide Serving Bowl",
    blurb: "The one that ends up on the table every night.",
    description:
      "A wide, shallow serving bowl with a soft foot and a clear satin glaze over pale stoneware. Big enough for a salad for four. Thrown thin at the rim so it does not feel heavy when full.",
    priceCents: 6800,
    compareAtCents: 7800,
    sku: "CER-BWL-01",
    stock: 3,
    category: "ceramics",
    published: 21,
  },
  {
    slug: "indigo-dyed-linen-napkins",
    name: "Indigo Dyed Linen Napkins",
    blurb: "A set of four, dipped in a living indigo vat. No two alike.",
    description:
      "Four heavyweight linen napkins, dipped in a natural indigo vat kept alive in the studio. Colour varies across the set — that is the point. Softens considerably after the first wash. Wash cold and separately for the first few cycles; indigo continues to give up a little colour for a while.",
    priceCents: 4800,
    sku: "TEX-NAP-04",
    category: "textiles",
    options: [{ name: "Set size", values: ["Set of 2", "Set of 4"] }],
    variants: [
      { options: ["Set of 2"], stock: 4, priceCents: 2800, sku: "TEX-NAP-02" },
      { options: ["Set of 4"], stock: 6, sku: "TEX-NAP-04S" },
    ],
    featured: true,
    published: 3,
  },
  {
    slug: "block-printed-tea-towel",
    name: "Block Printed Tea Towel",
    blurb: "Carved lino, pressed by hand onto washed cotton.",
    description:
      "A generous cotton tea towel, hand printed with a lino block cut in the studio. The registration wanders by a millimetre or two across the run, which is how you know a person did it. Pre-washed, so it will not shrink on you.",
    priceCents: 2600,
    sku: "TEX-TWL-01",
    category: "textiles",
    options: [{ name: "Design", values: ["Fern", "Wheat", "Thistle"] }],
    variants: [
      { options: ["Fern"], stock: 6, sku: "TEX-TWL-01-FRN" },
      { options: ["Wheat"], stock: 5, sku: "TEX-TWL-01-WHT" },
      { options: ["Thistle"], stock: 0, sku: "TEX-TWL-01-THS" },
    ],
    published: 55,
  },
  {
    slug: "madder-dyed-table-runner",
    name: "Madder Dyed Table Runner",
    blurb: "Dyed with madder root — a warm, uneven, living red.",
    description:
      "A long linen runner dyed with madder root, giving a soft brick red that shifts along the length of the cloth. Hand-hemmed. Roughly 180cm by 40cm. Keep it out of direct sun and the colour will hold for years.",
    priceCents: 7400,
    sku: "TEX-RUN-01",
    stock: 2,
    category: "textiles",
    published: 14,
  },
  {
    slug: "marbled-notebook",
    name: "Marbled Notebook",
    blurb: "Hand-marbled cover, coptic bound, 120 pages of cream stock.",
    description:
      "Each cover is floated on a marbling bath one at a time, so the pattern is genuinely unique. Coptic bound, which means it lies completely flat when open — the reason this binding is worth the extra hour. 120 pages of unlined cream stock that takes fountain pen ink without feathering.",
    priceCents: 2400,
    sku: "PAP-NTB-01",
    stock: 20,
    category: "paper",
    featured: true,
    published: 5,
  },
  {
    slug: "letterpress-card-set",
    name: "Letterpress Card Set",
    blurb: "Six blank cards, deeply impressed on cotton rag paper.",
    description:
      "Six blank cards printed on a hand-fed platen press, with a deep bite into soft cotton rag paper — run your thumb over it and you can feel the type. Blank inside for your own words. Includes six matching envelopes.",
    priceCents: 1800,
    sku: "PAP-CRD-06",
    stock: 30,
    category: "paper",
    published: 70,
  },
  {
    slug: "marbled-paper-sheets",
    name: "Marbled Paper Sheets",
    blurb: "Five large sheets, for binding, wrapping or framing.",
    description:
      "Five A2 sheets of hand-marbled paper, each one different. Sold for bookbinding and box-making, though plenty of people frame them instead. Colours vary by batch; the photograph shows a representative set.",
    priceCents: 3400,
    sku: "PAP-SHT-05",
    stock: 8,
    category: "paper",
    published: 30,
  },
  {
    slug: "beginners-weaving-kit",
    name: "Beginner's Weaving Kit",
    blurb: "Frame loom, three yarns, a shuttle, and a very patient guide.",
    description:
      "Everything needed for a first weaving, including a wooden frame loom, warp thread, three yarns chosen to work together, a shuttle, a tapestry needle and a comb. The instructions assume you have never done this before and do not skip the awkward parts. Expect your first piece to take an evening.",
    priceCents: 6500,
    sku: "KIT-WEA-01",
    stock: 9,
    category: "kits",
    featured: true,
    published: 2,
  },
  {
    slug: "candle-making-kit",
    name: "Candle Making Kit",
    blurb: "Soy wax, cotton wicks, two reusable tins and three scents.",
    description:
      "Soy wax flakes, cotton wicks, two reusable steel tins and three scent oils — cedar, fig and a green herbal blend. Makes two candles with wax to spare for a third if you are careful. Sold out more often than not; restocks are announced in the journal first.",
    priceCents: 5200,
    sku: "KIT-CND-01",
    stock: 0,
    category: "kits",
    published: 60,
  },
  {
    slug: "natural-dye-starter-kit",
    name: "Natural Dye Starter Kit",
    blurb: "Madder, weld and a bag of alum. Bring your own stock pot.",
    description:
      "A starter set for natural dyeing: madder root, weld, alum mordant, a pair of undyed cotton squares to practise on, and notes on the ratios that actually matter. Deliberately does not include a pot — use one you never plan to cook in again.",
    priceCents: 4400,
    sku: "KIT-DYE-01",
    stock: 7,
    category: "kits",
    published: 9,
  },
  {
    slug: "winter-glaze-test-tiles",
    name: "Winter Glaze Test Tiles",
    blurb: "Not for sale yet — a draft, to prove drafts stay hidden.",
    description:
      "A set of glaze test tiles from the winter firings. This product is intentionally left in DRAFT status by the seed script so there is always one record proving that unpublished products never reach the storefront.",
    priceCents: 1500,
    sku: "CER-TST-01",
    stock: 5,
    category: "ceramics",
    status: ProductStatus.DRAFT,
  },
];

function daysAgo(n: number) {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000);
}

async function main() {
  // Seeding is rerunnable: wipe the catalogue, then rebuild it.
  await db.productImage.deleteMany();
  await db.product.deleteMany();
  await db.category.deleteMany();

  const categoryIds = new Map<string, string>();
  for (const c of categories) {
    const row = await db.category.create({ data: c });
    categoryIds.set(c.slug, row.id);
  }

  for (const p of products) {
    const status = p.status ?? ProductStatus.PUBLISHED;
    const created = await db.product.create({
      data: {
        slug: p.slug,
        name: p.name,
        blurb: p.blurb,
        description: p.description,
        priceCents: p.priceCents,
        compareAtCents: p.compareAtCents ?? null,
        sku: p.sku,
        status,
        featured: p.featured ?? false,
        publishedAt:
          status === ProductStatus.PUBLISHED
            ? daysAgo(p.published ?? 30)
            : null,
        categoryId: categoryIds.get(p.category)!,
        options: {
          create: (p.options ?? []).map((o, i) => ({
            name: o.name,
            position: i,
          })),
        },
      },
    });

    // Every product gets at least one variant, even with no options — that
    // uniformity keeps stock in exactly one place and spares the storefront a
    // second code path for "products without variants".
    const variants: SeedVariant[] =
      p.variants ?? [{ options: [], stock: p.stock ?? 0, sku: undefined }];

    await db.productVariant.createMany({
      data: variants.map((v, i) => ({
        productId: created.id,
        option1: v.options[0] ?? null,
        option2: v.options[1] ?? null,
        option3: v.options[2] ?? null,
        priceCents: v.priceCents ?? null,
        stock: v.stock,
        sku: v.sku ?? null,
        position: i,
      })),
    });
  }

  const [cats, all, live, variants, withOptions] = await Promise.all([
    db.category.count(),
    db.product.count(),
    db.product.count({ where: { status: ProductStatus.PUBLISHED } }),
    db.productVariant.count(),
    db.product.count({ where: { options: { some: {} } } }),
  ]);
  console.log(
    `Seeded ${cats} categories, ${all} products (${live} published, ${all - live} draft), ` +
      `${variants} variants across them, ${withOptions} with option axes.`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
