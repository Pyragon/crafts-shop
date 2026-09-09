"use server";

import { getCurrentUser } from "@/lib/auth";
import { createPendingOrder, attachPaymentIntent, type ShippingDetails } from "@/lib/orders";
import { stripe, stripeConfigured } from "@/lib/stripe";
import { isShippingOption } from "@/lib/shipping";

export type CheckoutStart =
  | { ok: true; clientSecret: string; orderNumber: string; totalCents: number }
  | { ok: false; error: string };

function required(form: FormData, key: string): string {
  return String(form.get(key) ?? "").trim();
}

/**
 * Creates the order and its PaymentIntent, and hands back the client secret.
 *
 * The amount comes from the database, never the form. A client that posts a
 * different total changes nothing — it is recomputed from live cart contents
 * and live prices.
 */
export async function startCheckout(formData: FormData): Promise<CheckoutStart> {
  if (!stripeConfigured()) {
    return { ok: false, error: "Payments are not configured yet." };
  }

  const email = required(formData, "email").toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return { ok: false, error: "Enter a valid email address." };
  }

  const shippingMethod = required(formData, "shippingMethod");
  if (!isShippingOption(shippingMethod)) {
    return { ok: false, error: "Choose a shipping option." };
  }

  const details: ShippingDetails = {
    email,
    name: required(formData, "name"),
    line1: required(formData, "line1"),
    line2: required(formData, "line2") || undefined,
    city: required(formData, "city"),
    region: required(formData, "region") || undefined,
    postalCode: required(formData, "postalCode"),
    country: required(formData, "country") || "CA",
    phone: required(formData, "phone") || undefined,
    shippingMethod,
  };

  for (const [field, label] of [
    ["name", "name"],
    ["line1", "address"],
    ["city", "city"],
    ["postalCode", "postal code"],
  ] as const) {
    if (!details[field]) return { ok: false, error: `Enter your ${label}.` };
  }

  const user = await getCurrentUser();
  const created = await createPendingOrder(details, user?.id ?? null);
  if (!created.ok) return { ok: false, error: created.error };

  const order = await stripeOrderNumber(created.orderId);

  const intent = await stripe().paymentIntents.create({
    amount: created.totals.totalCents,
    currency: "cad",
    receipt_email: email,
    // The webhook is the source of truth, and it only gets these ids.
    metadata: { orderId: created.orderId, orderNumber: order },
    automatic_payment_methods: { enabled: true },
    shipping: {
      name: details.name,
      phone: details.phone,
      address: {
        line1: details.line1,
        line2: details.line2,
        city: details.city,
        state: details.region,
        postal_code: details.postalCode,
        country: details.country,
      },
    },
  });

  await attachPaymentIntent(created.orderId, intent.id);

  if (!intent.client_secret) {
    return { ok: false, error: "Could not start the payment. Please try again." };
  }

  return {
    ok: true,
    clientSecret: intent.client_secret,
    orderNumber: order,
    totalCents: created.totals.totalCents,
  };
}

async function stripeOrderNumber(orderId: string): Promise<string> {
  const { db } = await import("@/lib/db");
  const order = await db.order.findUnique({
    where: { id: orderId },
    select: { number: true },
  });
  return order?.number ?? "";
}
