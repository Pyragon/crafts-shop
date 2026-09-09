import { createHash } from "node:crypto";
import { cookies } from "next/headers";
import { ProductStatus } from "@prisma/client";
import { db } from "./db";
import { variantLabel, variantPrice } from "./variants";

/**
 * Cart persistence.
 *
 * The cart lives in the database, keyed by an opaque token in an httpOnly
 * cookie, rather than in the cookie itself. That keeps quantities and prices
 * server-authoritative (a cookie-stored cart is trivially edited by the
 * client), survives across devices once accounts exist, and leaves the door
 * open for abandoned-cart reporting in the admin.
 *
 * Line prices are read live from the product rather than snapshotted at add
 * time, so a price change is reflected before checkout. The snapshot happens
 * on the order in Phase 4, which is where it actually matters.
 */

export const CART_COOKIE = "mbc-cart";
const CART_COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

/** What the customer typed, keyed by personalisation field id. */
export type PersonalisationInput = Record<string, string>;

export type CartLinePersonalisation = {
  label: string;
  value: string;
};

export type CartLine = {
  id: string;
  variantId: string;
  slug: string;
  name: string;
  /** "Oatmeal / Large", or "" when the product has no options. */
  variantLabel: string;
  blurb: string;
  unitPriceCents: number;
  quantity: number;
  /** Current stock, so the UI can cap the quantity control. */
  stock: number;
  lineTotalCents: number;
  image: { url: string; alt: string } | null;
  /** Empty unless the variant asked for personalisation. */
  personalisation: CartLinePersonalisation[];
};

export type CartSummary = {
  lines: CartLine[];
  /** Total number of individual items, for the header badge. */
  count: number;
  subtotalCents: number;
};

export const EMPTY_CART: CartSummary = {
  lines: [],
  count: 0,
  subtotalCents: 0,
};

const cartInclude = {
  items: {
    orderBy: { createdAt: "asc" as const },
    include: {
      personalisation: {
        include: { field: { select: { label: true, position: true } } },
      },
      variant: {
        include: {
          product: {
            select: {
              id: true,
              slug: true,
              name: true,
              blurb: true,
              priceCents: true,
              status: true,
              images: {
                orderBy: { position: "asc" as const },
                take: 1,
                select: { url: true, alt: true },
              },
            },
          },
        },
      },
    },
  },
};

/** Reads the cart token without creating anything. */
export async function getCartToken(): Promise<string | undefined> {
  const store = await cookies();
  return store.get(CART_COOKIE)?.value;
}

/**
 * Loads the current cart. Deliberately does not create one — a plain page view
 * (including every crawler hit) should not write a row.
 */
export async function getCart(): Promise<CartSummary> {
  const token = await getCartToken();
  if (!token) return EMPTY_CART;

  const cart = await db.cart.findUnique({
    where: { token },
    include: cartInclude,
  });
  if (!cart) return EMPTY_CART;

  return summarise(cart.items);
}

type RawItem = {
  id: string;
  quantity: number;
  personalisation: {
    value: string;
    field: { label: string; position: number };
  }[];
  variant: {
    id: string;
    option1: string | null;
    option2: string | null;
    option3: string | null;
    priceCents: number | null;
    stock: number;
    product: {
      id: string;
      slug: string;
      name: string;
      blurb: string;
      priceCents: number;
      status: ProductStatus;
      images: { url: string; alt: string }[];
    };
  };
};

function summarise(items: RawItem[]): CartSummary {
  const lines: CartLine[] = items
    // A product unpublished after it was added should drop out rather than
    // being purchasable through a stale cart.
    .filter((item) => item.variant.product.status === ProductStatus.PUBLISHED)
    .map((item) => {
      const unit = variantPrice(item.variant, item.variant.product.priceCents);
      return {
        id: item.id,
        variantId: item.variant.id,
        slug: item.variant.product.slug,
        name: item.variant.product.name,
        variantLabel: variantLabel(item.variant),
        blurb: item.variant.product.blurb,
        unitPriceCents: unit,
        quantity: item.quantity,
        stock: item.variant.stock,
        lineTotalCents: unit * item.quantity,
        image: item.variant.product.images[0] ?? null,
        personalisation: [...item.personalisation]
          .sort((a, b) => a.field.position - b.field.position)
          .map((p) => ({ label: p.field.label, value: p.value })),
      };
    });

  return {
    lines,
    count: lines.reduce((n, l) => n + l.quantity, 0),
    subtotalCents: lines.reduce((n, l) => n + l.lineTotalCents, 0),
  };
}

/** Creates the cart row and sets the cookie. Only call from a Server Action. */
async function getOrCreateCart() {
  const store = await cookies();
  const token = store.get(CART_COOKIE)?.value;

  if (token) {
    const existing = await db.cart.findUnique({ where: { token } });
    if (existing) return existing;
  }

  const cart = await db.cart.create({
    data: { token: crypto.randomUUID() },
  });
  store.set(CART_COOKIE, cart.token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: CART_COOKIE_MAX_AGE,
    secure: process.env.NODE_ENV === "production",
  });
  return cart;
}

export type CartMutationResult =
  | { ok: true; cart: CartSummary }
  | { ok: false; error: string; cart: CartSummary };

async function currentSummary(cartId: string): Promise<CartSummary> {
  const cart = await db.cart.findUnique({
    where: { id: cartId },
    include: cartInclude,
  });
  return cart ? summarise(cart.items) : EMPTY_CART;
}

/**
 * Validates what the customer typed against the product's field definitions
 * and returns a stable digest.
 *
 * The digest is what keeps two monograms on the same variant as two cart
 * lines, while adding the identical thing twice still just bumps the quantity.
 * It is sorted by field id so key order can never change the result.
 */
function personalisationDigest(
  entries: { fieldId: string; value: string }[],
): string {
  if (entries.length === 0) return "";
  const canonical = [...entries]
    .sort((a, b) => a.fieldId.localeCompare(b.fieldId))
    .map((e) => `${e.fieldId}=${e.value}`)
    .join("\u0000");
  return createHash("sha256").update(canonical).digest("hex").slice(0, 32);
}

type PersonalisationCheck =
  | { ok: true; entries: { fieldId: string; value: string }[]; key: string }
  | { ok: false; error: string };

async function checkPersonalisation(
  productId: string,
  personalised: boolean,
  input: PersonalisationInput | undefined,
): Promise<PersonalisationCheck> {
  // A variant that asks for nothing stores nothing, even if the client sent
  // values — the server decides, not the form.
  if (!personalised) return { ok: true, entries: [], key: "" };

  const fields = await db.personalisationField.findMany({
    where: { productId },
    orderBy: { position: "asc" },
    select: { id: true, label: true, maxLength: true, required: true },
  });
  if (fields.length === 0) return { ok: true, entries: [], key: "" };

  const entries: { fieldId: string; value: string }[] = [];
  for (const field of fields) {
    const raw = (input?.[field.id] ?? "").trim().replace(/\s+/g, " ");
    if (!raw) {
      if (field.required) {
        return { ok: false, error: `${field.label} is required.` };
      }
      continue;
    }
    if (raw.length > field.maxLength) {
      return {
        ok: false,
        error: `${field.label} must be ${field.maxLength} characters or fewer.`,
      };
    }
    entries.push({ fieldId: field.id, value: raw });
  }
  return { ok: true, entries, key: personalisationDigest(entries) };
}

export async function addToCart(
  variantId: string,
  quantity = 1,
  personalisation?: PersonalisationInput,
): Promise<CartMutationResult> {
  const variant = await db.productVariant.findFirst({
    where: { id: variantId, product: { status: ProductStatus.PUBLISHED } },
    select: {
      id: true,
      stock: true,
      option1: true,
      option2: true,
      option3: true,
      priceCents: true,
      personalised: true,
      productId: true,
      product: { select: { name: true } },
    },
  });
  if (!variant) {
    return { ok: false, error: "That option is no longer available.", cart: await getCart() };
  }

  const label = variantLabel(variant);
  const name = label
    ? `${variant.product.name} (${label})`
    : variant.product.name;

  const checked = await checkPersonalisation(
    variant.productId,
    variant.personalised,
    personalisation,
  );
  if (!checked.ok) {
    return { ok: false, error: checked.error, cart: await getCart() };
  }

  const cart = await getOrCreateCart();
  const existing = await db.cartItem.findUnique({
    where: {
      cartId_variantId_personalisationKey: {
        cartId: cart.id,
        variantId,
        personalisationKey: checked.key,
      },
    },
    select: { quantity: true },
  });

  const wanted = (existing?.quantity ?? 0) + Math.max(1, quantity);

  if (variant.stock <= 0) {
    return { ok: false, error: `${name} is sold out.`, cart: await currentSummary(cart.id) };
  }
  // Clamp rather than reject, so adding one too many still does the useful
  // thing instead of losing the click.
  const capped = Math.min(wanted, variant.stock);

  await db.cartItem.upsert({
    where: {
      cartId_variantId_personalisationKey: {
        cartId: cart.id,
        variantId,
        personalisationKey: checked.key,
      },
    },
    create: {
      cartId: cart.id,
      variantId,
      quantity: capped,
      personalisationKey: checked.key,
      personalisation: {
        create: checked.entries.map((e) => ({
          fieldId: e.fieldId,
          value: e.value,
        })),
      },
    },
    update: { quantity: capped },
  });

  const summary = await currentSummary(cart.id);
  if (capped < wanted) {
    return {
      ok: false,
      error: `Only ${variant.stock} of ${name} left — the cart holds that many.`,
      cart: summary,
    };
  }
  return { ok: true, cart: summary };
}

export async function updateCartItem(
  itemId: string,
  quantity: number,
): Promise<CartMutationResult> {
  const token = await getCartToken();
  if (!token) return { ok: false, error: "Your cart has expired.", cart: EMPTY_CART };

  // Scope the lookup by cookie token so one cart can't edit another's rows.
  const item = await db.cartItem.findFirst({
    where: { id: itemId, cart: { token } },
    select: {
      id: true,
      cartId: true,
      variant: {
        select: {
          stock: true,
          option1: true,
          option2: true,
          option3: true,
          priceCents: true,
          product: { select: { name: true } },
        },
      },
    },
  });
  if (!item) return { ok: false, error: "That item is no longer in your cart.", cart: await getCart() };

  if (quantity <= 0) {
    await db.cartItem.delete({ where: { id: item.id } });
    return { ok: true, cart: await currentSummary(item.cartId) };
  }

  const capped = Math.min(quantity, item.variant.stock);
  await db.cartItem.update({ where: { id: item.id }, data: { quantity: capped } });

  const summary = await currentSummary(item.cartId);
  if (capped < quantity) {
    const label = variantLabel(item.variant);
    const name = label
      ? `${item.variant.product.name} (${label})`
      : item.variant.product.name;
    return {
      ok: false,
      error: `Only ${item.variant.stock} of ${name} left.`,
      cart: summary,
    };
  }
  return { ok: true, cart: summary };
}

export async function removeCartItem(itemId: string): Promise<CartMutationResult> {
  const token = await getCartToken();
  if (!token) return { ok: false, error: "Your cart has expired.", cart: EMPTY_CART };

  const item = await db.cartItem.findFirst({
    where: { id: itemId, cart: { token } },
    select: { id: true, cartId: true },
  });
  if (!item) return { ok: false, error: "That item is no longer in your cart.", cart: await getCart() };

  await db.cartItem.delete({ where: { id: item.id } });
  return { ok: true, cart: await currentSummary(item.cartId) };
}

/**
 * Called at sign-in (Phase 3): folds the anonymous cookie cart into the
 * user's own, summing quantities and clamping to stock, then deletes the
 * anonymous one.
 */
export async function mergeCartIntoUser(userId: string): Promise<void> {
  const token = await getCartToken();
  if (!token) return;

  const anon = await db.cart.findUnique({
    where: { token },
    include: {
      items: {
        include: {
          variant: { select: { stock: true } },
          personalisation: { select: { fieldId: true, value: true } },
        },
      },
    },
  });
  if (!anon || anon.userId === userId) return;

  const userCart =
    (await db.cart.findFirst({ where: { userId } })) ??
    (await db.cart.create({ data: { token: crypto.randomUUID(), userId } }));

  for (const item of anon.items) {
    const existing = await db.cartItem.findUnique({
      where: {
        cartId_variantId_personalisationKey: {
          cartId: userCart.id,
          variantId: item.variantId,
          personalisationKey: item.personalisationKey,
        },
      },
      select: { quantity: true },
    });
    const merged = Math.min(
      (existing?.quantity ?? 0) + item.quantity,
      item.variant.stock,
    );
    if (merged <= 0) continue;
    await db.cartItem.upsert({
      where: {
        cartId_variantId_personalisationKey: {
          cartId: userCart.id,
          variantId: item.variantId,
          personalisationKey: item.personalisationKey,
        },
      },
      create: {
        cartId: userCart.id,
        variantId: item.variantId,
        quantity: merged,
        personalisationKey: item.personalisationKey,
        personalisation: {
          create: item.personalisation.map((v) => ({
            fieldId: v.fieldId,
            value: v.value,
          })),
        },
      },
      update: { quantity: merged },
    });
  }

  await db.cart.delete({ where: { id: anon.id } });

  const store = await cookies();
  store.set(CART_COOKIE, userCart.token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: CART_COOKIE_MAX_AGE,
    secure: process.env.NODE_ENV === "production",
  });
}
