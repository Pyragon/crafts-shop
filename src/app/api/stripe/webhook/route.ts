import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe, stripeConfigured } from "@/lib/stripe";
import {
  clearCartForOrder,
  getOrderByPaymentIntent,
  markOrderPaid,
  recordEvent,
} from "@/lib/orders";
import { sendOrderConfirmation, sendShopOrderAlert } from "@/lib/email";
import { db } from "@/lib/db";
import { OrderEventType, PaymentStatus } from "@prisma/client";

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
            // Customer receipt and the shop's own copy. Sent independently so
            // a failure to reach one cannot stop the other.
            await sendOrderConfirmation(order);
            await sendShopOrderAlert(order);
            await clearCartForOrder(result.orderId).catch(() => {});
          }
        }
        break;
      }

      case "payment_intent.payment_failed": {
        const intent = event.data.object;
        const reason = intent.last_payment_error?.message ?? "unknown";
        console.warn(`[stripe] payment failed for ${intent.id}: ${reason}`);
        const failed = await getOrderByPaymentIntent(intent.id);
        if (failed) {
          await db.order.update({
            where: { id: failed.id },
            data: { paymentStatus: PaymentStatus.FAILED },
          });
          await recordEvent(failed.id, OrderEventType.PAYMENT_FAILED, `Payment failed: ${reason}`);
        }
        break;
      }

      case "charge.refunded": {
        const charge = event.data.object;
        if (typeof charge.payment_intent === "string") {
          const refunded = await getOrderByPaymentIntent(charge.payment_intent);
          if (refunded) {
            // Stripe reports partial refunds through the same event.
            const full = charge.amount_refunded >= charge.amount;
            await db.order.update({
              where: { id: refunded.id },
              data: {
                paymentStatus: full
                  ? PaymentStatus.REFUNDED
                  : PaymentStatus.PARTIALLY_REFUNDED,
              },
            });
            await recordEvent(
              refunded.id,
              OrderEventType.REFUNDED,
              `${full ? "Full" : "Partial"} refund of ${(charge.amount_refunded / 100).toFixed(2)}`,
            );
          }
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
