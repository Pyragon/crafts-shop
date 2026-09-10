import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe, stripeConfigured } from "@/lib/stripe";
import {
  clearCartForOrder,
  getOrderByPaymentIntent,
  markOrderPaid,
} from "@/lib/orders";
import { sendOrderConfirmation } from "@/lib/email";
import { db } from "@/lib/db";
import { OrderStatus } from "@prisma/client";

/**
 * Stripe webhook — the source of truth for whether an order was paid.
 *
 * Deliberately not the browser's return trip: a customer who pays and then
 * closes the tab, or loses signal, must still get their order. The redirect
 * back to the site is only a nicety.
 *
 * Signature is verified against the raw body, so a forged request cannot mark
 * orders paid.
 */
export async function POST(request: Request) {
  if (!stripeConfigured() || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "not configured" }, { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "missing signature" }, { status: 400 });
  }

  // Must be the raw body — parsing it first would break the signature.
  const payload = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(
      payload,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (error) {
    console.error("[stripe] signature verification failed:", error);
    return NextResponse.json({ error: "bad signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "payment_intent.succeeded": {
        const intent = event.data.object;
        const result = await markOrderPaid(intent.id);

        // Stripe retries and can deliver an event twice; only act the once.
        if (result.ok && result.orderId && !result.alreadyPaid) {
          const order = await getOrderByPaymentIntent(intent.id);
          if (order) {
            await sendOrderConfirmation(order);
            await clearCartForOrder(result.orderId).catch(() => {});
          }
        }
        break;
      }

      case "payment_intent.payment_failed": {
        const intent = event.data.object;
        console.warn(
          `[stripe] payment failed for ${intent.id}: ${intent.last_payment_error?.message ?? "unknown"}`,
        );
        break;
      }

      case "charge.refunded": {
        const charge = event.data.object;
        if (typeof charge.payment_intent === "string") {
          await db.order.updateMany({
            where: { stripePaymentIntentId: charge.payment_intent },
            data: { status: OrderStatus.REFUNDED },
          });
        }
        break;
      }
    }
  } catch (error) {
    // A 500 makes Stripe retry, which is what we want for a transient failure.
    console.error(`[stripe] handler failed for ${event.type}:`, error);
    return NextResponse.json({ error: "handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
