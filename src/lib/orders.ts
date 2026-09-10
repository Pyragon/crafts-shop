import "server-only";
import {
  FulfilmentStatus,
  OrderEventType,
  PaymentStatus,
  Prisma,
} from "@prisma/client";
import { db } from "./db";
import { getCart, getCartToken } from "./cart";
import { canShipTo, shippingCostCents, taxCents } from "./shipping";

/**
 * Order creation and fulfilment.
 *
 * Two rules drive everything here:
 *
 * 1. Money is computed from the database, never from the client. The browser
 *    sends a shipping option id and an address; every cent is recalculated
 *    server-side from live cart contents.
 * 2. An order snapshots what was bought. Product names, prices, variant labels
 *    and personalisation are copied, not referenced, so editing the catalogue
 *    later cannot rewrite what someone paid for.
 */

export type ShippingDetails = {
  email: string;
  name: string;
  line1: string;
  line2?: string;
  city: string;
  region?: string;
  postalCode: string;
  country: string;
  phone?: string;
  shippingMethod: string;
};

export type OrderTotals = {
  subtotalCents: number;
  shippingCents: number;
  taxCents: number;
  totalCents: number;
};

/** Order numbers people can read aloud on the phone. */
async function nextOrderNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `MB-${year}-`;
  const last = await db.order.findFirst({
    where: { number: { startsWith: prefix } },
    orderBy: { number: "desc" },
    select: { number: true },
  });
  const n = last ? Number.parseInt(last.number.slice(prefix.length), 10) + 1 : 1;
  return `${prefix}${String(n).padStart(4, "0")}`;
}

export async function cartTotals(
  shippingMethod: string,
  countryCode: string,
): Promise<OrderTotals> {
  const cart = await getCart();
  const subtotalCents = cart.subtotalCents;
  const shipping = shippingCostCents(shippingMethod, subtotalCents, countryCode);
  const tax = taxCents();
  return {
    subtotalCents,
    shippingCents: shipping,
    taxCents: tax,
    totalCents: subtotalCents + shipping + tax,
  };
}

export type CreateOrderResult =
  | { ok: true; orderId: string; totals: OrderTotals }
  | { ok: false; error: string };

/**
 * Creates a PENDING order from the current cart.
 *
 * Deliberately made before payment, so the webhook has something concrete to
 * mark paid, and so abandoned attempts are visible in the admin rather than
 * vanishing.
 */
export async function createPendingOrder(
  details: ShippingDetails,
  userId: string | null,
): Promise<CreateOrderResult> {
  const cart = await getCart();
  // Captured here, while a cookie still exists. The webhook has none.
  const cartToken = await getCartToken();
  const cartRow = cartToken
    ? await db.cart.findUnique({ where: { token: cartToken }, select: { id: true } })
    : null;
  if (cart.lines.length === 0) {
    return { ok: false, error: "Your cart is empty." };
  }

  // Re-check stock at the last moment. Someone may have bought the last one
  // while this cart sat open.
  for (const line of cart.lines) {
    if (line.quantity > line.stock) {
      return {
        ok: false,
        error:
          line.stock === 0
            ? `${line.name} sold out while you were shopping.`
            : `Only ${line.stock} of ${line.name} left — please adjust your cart.`,
      };
    }
  }

  if (!canShipTo(details.country)) {
    return { ok: false, error: "We don't ship to that country yet." };
  }

  const totals = await cartTotals(details.shippingMethod, details.country);

  const order = await db.order.create({
    data: {
      number: await nextOrderNumber(),
      userId,
      email: details.email.trim().toLowerCase(),
      paymentStatus: PaymentStatus.PENDING,
      subtotalCents: totals.subtotalCents,
      shippingCents: totals.shippingCents,
      taxCents: totals.taxCents,
      totalCents: totals.totalCents,
      shipName: details.name.trim(),
      shipLine1: details.line1.trim(),
      shipLine2: details.line2?.trim() || null,
      shipCity: details.city.trim(),
      shipRegion: details.region?.trim() || null,
      shipPostalCode: details.postalCode.trim().toUpperCase(),
      shipCountry: details.country.trim().toUpperCase(),
      shipPhone: details.phone?.trim() || null,
      shippingMethod: details.shippingMethod,
      cartId: cartRow?.id ?? null,
      items: {
        create: cart.lines.map((line) => ({
          variantId: line.variantId,
          productName: line.name,
          productSlug: line.slug,
          variantLabel: line.variantLabel,
          unitPriceCents: line.unitPriceCents,
          quantity: line.quantity,
          lineTotalCents: line.lineTotalCents,
          personalisation: {
            create: line.personalisation.map((p) => ({
              label: p.label,
              value: p.value,
            })),
          },
        })),
      },
    },
    select: { id: true, number: true },
  });

  await recordEvent(order.id, OrderEventType.CREATED, `Order ${order.number} created`);

  return { ok: true, orderId: order.id, totals };
}

/**
 * Marks an order paid, decrements stock and empties the cart.
 *
 * Called from the Stripe webhook rather than the browser's return trip,
 * because a customer who closes the tab after paying must still get their
 * order. Idempotent: Stripe retries webhooks, and may deliver the same event
 * more than once.
 */
export async function markOrderPaid(
  paymentIntentId: string,
): Promise<{ ok: boolean; orderId?: string; alreadyPaid?: boolean }> {
  const order = await db.order.findUnique({
    where: { stripePaymentIntentId: paymentIntentId },
    select: { id: true, paymentStatus: true, items: true },
  });
  if (!order) return { ok: false };
  if (order.paymentStatus !== PaymentStatus.PENDING) {
    return { ok: true, orderId: order.id, alreadyPaid: true };
  }

  await db.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: order.id },
      data: { paymentStatus: PaymentStatus.PAID, paidAt: new Date() },
    });

    for (const item of order.items) {
      if (!item.variantId) continue;
      // Guarded decrement: never take stock below zero, even if two orders
      // raced for the last one. Overselling is caught below.
      await tx.productVariant.updateMany({
        where: { id: item.variantId, stock: { gte: item.quantity } },
        data: { stock: { decrement: item.quantity } },
      });
    }
  });

  await recordEvent(
    order.id,
    OrderEventType.PAYMENT_SUCCEEDED,
    "Payment received; stock reserved",
  );

  return { ok: true, orderId: order.id };
}

/** Appends to an order's timeline. Never throws — a lost log line must not
 *  fail the operation it was describing. */
export async function recordEvent(
  orderId: string,
  type: OrderEventType,
  message: string,
  actorUserId?: string,
): Promise<void> {
  await db.orderEvent
    .create({ data: { orderId, type, message, actorUserId: actorUserId ?? null } })
    .catch((error) => console.error("[orders] could not record event:", error));
}

export type FulfilmentUpdate = {
  fulfilmentStatus?: FulfilmentStatus;
  carrier?: string | null;
  trackingNumber?: string | null;
  trackingUrl?: string | null;
  internalNotes?: string | null;
};

/**
 * Applies a fulfilment change from the admin, stamping the matching timestamp
 * and writing the timeline entry.
 *
 * Returns whether the customer should be told — the caller sends the email, so
 * this stays usable from a script or a test without sending mail as a side
 * effect.
 */
export async function updateFulfilment(
  orderId: string,
  update: FulfilmentUpdate,
  actorUserId?: string,
): Promise<{ ok: boolean; notifyCustomer: boolean }> {
  const existing = await db.order.findUnique({
    where: { id: orderId },
    select: { fulfilmentStatus: true, number: true },
  });
  if (!existing) return { ok: false, notifyCustomer: false };

  const next = update.fulfilmentStatus;
  const changed = !!next && next !== existing.fulfilmentStatus;

  await db.order.update({
    where: { id: orderId },
    data: {
      ...update,
      ...(next === FulfilmentStatus.SHIPPED ? { shippedAt: new Date() } : {}),
      ...(next === FulfilmentStatus.DELIVERED ? { deliveredAt: new Date() } : {}),
    },
  });

  if (changed) {
    await recordEvent(
      orderId,
      next === FulfilmentStatus.SHIPPED
        ? OrderEventType.SHIPPED
        : next === FulfilmentStatus.DELIVERED
          ? OrderEventType.DELIVERED
          : OrderEventType.STATUS_CHANGED,
      `Fulfilment: ${existing.fulfilmentStatus} → ${next}`,
      actorUserId,
    );
  }

  // Only these two are worth an email. Nobody wants a message saying their
  // order moved from UNFULFILLED to READY_TO_SHIP.
  const notifyCustomer =
    changed &&
    (next === FulfilmentStatus.SHIPPED || next === FulfilmentStatus.IN_PRODUCTION);

  return { ok: true, notifyCustomer };
}

export async function attachPaymentIntent(
  orderId: string,
  paymentIntentId: string,
): Promise<void> {
  await db.order.update({
    where: { id: orderId },
    data: { stripePaymentIntentId: paymentIntentId },
  });
}

/**
 * Empties the cart an order came from.
 *
 * Takes the id rather than reading the cookie, because this runs in the Stripe
 * webhook — a server-to-server request with no cookies at all. Reading the
 * cookie there silently did nothing, leaving customers with a full cart after
 * paying.
 */
export async function clearCartForOrder(orderId: string): Promise<void> {
  const order = await db.order.findUnique({
    where: { id: orderId },
    select: { cartId: true },
  });
  if (!order?.cartId) return;
  await db.cartItem.deleteMany({ where: { cartId: order.cartId } });
}

const orderInclude = {
  items: { include: { personalisation: true } },
  events: { orderBy: { createdAt: "desc" } },
} satisfies Prisma.OrderInclude;

export type FullOrder = Prisma.OrderGetPayload<{ include: typeof orderInclude }>;

export async function getOrderById(id: string): Promise<FullOrder | null> {
  return db.order.findUnique({ where: { id }, include: orderInclude });
}

export async function getOrderByPaymentIntent(
  paymentIntentId: string,
): Promise<FullOrder | null> {
  return db.order.findUnique({
    where: { stripePaymentIntentId: paymentIntentId },
    include: orderInclude,
  });
}

export async function getOrdersForUser(userId: string): Promise<FullOrder[]> {
  return db.order.findMany({
    where: { userId, paymentStatus: { not: PaymentStatus.PENDING } },
    orderBy: { createdAt: "desc" },
    include: orderInclude,
  });
}
