import type { FulfilmentStatus, PaymentStatus } from "@prisma/client";

/**
 * One badge summarising an order.
 *
 * Payment and fulfilment are separate fields, but showing two badges makes
 * customers ask which one matters. Payment problems win, because a refund or
 * failure is what someone needs to know first; otherwise fulfilment is the
 * interesting half.
 */
export function OrderStatusBadge({
  paymentStatus,
  fulfilmentStatus,
}: {
  paymentStatus: PaymentStatus;
  fulfilmentStatus: FulfilmentStatus;
}) {
  const { label, tone } = describe(paymentStatus, fulfilmentStatus);

  const tones: Record<string, string> = {
    good: "bg-sage-tint text-sage",
    active: "bg-clay-tint text-clay",
    muted: "bg-paper-sunk text-ink-soft",
  };

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${tones[tone]}`}
    >
      {label}
    </span>
  );
}

function describe(
  payment: PaymentStatus,
  fulfilment: FulfilmentStatus,
): { label: string; tone: "good" | "active" | "muted" } {
  if (payment === "REFUNDED") return { label: "Refunded", tone: "muted" };
  if (payment === "PARTIALLY_REFUNDED") {
    return { label: "Partially refunded", tone: "muted" };
  }
  if (payment === "FAILED") return { label: "Payment failed", tone: "muted" };

  switch (fulfilment) {
    case "DELIVERED":
      return { label: "Delivered", tone: "good" };
    case "SHIPPED":
      return { label: "On its way", tone: "good" };
    case "IN_PRODUCTION":
      return { label: "Being made", tone: "active" };
    case "READY_TO_SHIP":
      return { label: "Ready to ship", tone: "active" };
    case "CANCELLED":
      return { label: "Cancelled", tone: "muted" };
    default:
      return { label: "Confirmed", tone: "active" };
  }
}
