import "server-only";
import Stripe from "stripe";

/**
 * Server-side Stripe client.
 *
 * Created lazily so the app still builds and runs without keys — everything
 * except the payment step works, which keeps the shop developable before an
 * account exists.
 */
let client: Stripe | null = null;

export function stripe(): Stripe {
  if (!client) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error(
        "STRIPE_SECRET_KEY is not set — payments cannot be taken.",
      );
    }
    client = new Stripe(key);
  }
  return client;
}

export function stripeConfigured(): boolean {
  return !!process.env.STRIPE_SECRET_KEY;
}

/** Test keys are `sk_test_` / `pk_test_`; live are `sk_live_` / `pk_live_`. */
export function stripeIsTestMode(): boolean {
  return (process.env.STRIPE_SECRET_KEY ?? "").startsWith("sk_test_");
}
