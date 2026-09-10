import "server-only";
import { site } from "./site";

/**
 * Transactional email.
 *
 * Resend when `RESEND_API_KEY` is set, otherwise the message is printed to the
 * server console with its links intact. The fallback is deliberate: password
 * reset and verification stay testable on a machine with no credentials, and a
 * missing key can never silently swallow a message.
 *
 * Uses Resend's REST API directly rather than their SDK — one `fetch` call
 * against a stable endpoint is not worth another dependency in the path that
 * sends customers their receipts.
 */

type Message = {
  to: string;
  subject: string;
  body: string;
};

export type DeliveryResult =
  | { ok: true; id?: string; provider: "resend" | "console" }
  | { ok: false; error: string };

function fromAddress(): string {
  // Verified in Resend. Falls back to the apex so a missing env var is obvious
  // rather than producing a silently invalid sender.
  return process.env.EMAIL_FROM ?? `${site.name} <noreply@mabrowns.ca>`;
}

async function deliver(message: Message): Promise<DeliveryResult> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.log(
      [
        "",
        "──────────── EMAIL (not sent — RESEND_API_KEY is not set) ────────────",
        `To:      ${message.to}`,
        `From:    ${fromAddress()}`,
        `Subject: ${message.subject}`,
        "",
        message.body,
        "──────────────────────────────────────────────────────────────────────",
        "",
      ].join("\n"),
    );
    return { ok: true, provider: "console" };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromAddress(),
        to: [message.to],
        subject: message.subject,
        text: message.body,
      }),
      // A hung mail provider must not hold a sign-up open indefinitely.
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      // Logged, never surfaced: the caller shows the same message either way,
      // so a failure here cannot become an account-enumeration signal.
      console.error(
        `[email] Resend rejected the message (${response.status}): ${detail.slice(0, 300)}`,
      );
      return { ok: false, error: `Resend returned ${response.status}` };
    }

    const data = (await response.json().catch(() => ({}))) as { id?: string };
    return { ok: true, id: data.id, provider: "resend" };
  } catch (error) {
    console.error("[email] Could not reach Resend:", error);
    return { ok: false, error: "Could not reach the email provider." };
  }
}

function baseUrl(): string {
  return site.url.replace(/\/$/, "");
}

export async function sendPasswordResetEmail(
  to: string,
  name: string | null,
  token: string,
): Promise<DeliveryResult> {
  const link = `${baseUrl()}/reset-password?token=${encodeURIComponent(token)}`;
  return deliver({
    to,
    subject: `Reset your ${site.name} password`,
    body: [
      `Hello${name ? ` ${name}` : ""},`,
      "",
      "Someone asked to reset the password on this account. If that wasn't you,",
      "you can ignore this message and nothing will change.",
      "",
      link,
      "",
      "The link works once and expires in an hour.",
      "",
      `— ${site.name}`,
    ].join("\n"),
  });
}

export async function sendEmailVerification(
  to: string,
  name: string | null,
  token: string,
): Promise<DeliveryResult> {
  const link = `${baseUrl()}/verify-email?token=${encodeURIComponent(token)}`;
  return deliver({
    to,
    subject: `Confirm your email for ${site.name}`,
    body: [
      `Hello${name ? ` ${name}` : ""},`,
      "",
      "Confirm your email address so we can reach you about an order:",
      "",
      link,
      "",
      "The link expires in 48 hours. You do not need to confirm before ordering.",
      "",
      `— ${site.name}`,
    ].join("\n"),
  });
}

/** Where the shop's own copy of each order goes. */
function shopOrderInbox(): string {
  return process.env.SHOP_ORDER_EMAIL ?? "orders@mabrowns.ca";
}

type OrderForEmail = {
  number: string;
  email: string;
  totalCents: number;
  subtotalCents: number;
  shippingCents: number;
  shipName: string;
  shipLine1: string;
  shipLine2: string | null;
  shipCity: string;
  shipRegion: string | null;
  shipPostalCode: string;
  shipCountry: string;
  shippingMethod: string | null;
  items: {
    productName: string;
    variantLabel: string;
    quantity: number;
    lineTotalCents: number;
    personalisation: { label: string; value: string }[];
  }[];
};

function money(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

/**
 * The receipt.
 *
 * Sent from the webhook, so it goes out even if the customer closed the tab
 * the moment they paid. Includes the personalisation exactly as ordered —
 * it is the customer's only written record of what they asked to have made.
 */
export async function sendOrderConfirmation(
  order: OrderForEmail,
): Promise<DeliveryResult> {
  const lines = order.items.flatMap((item) => {
    const name = item.variantLabel
      ? `${item.productName} (${item.variantLabel})`
      : item.productName;
    return [
      `  ${item.quantity} x ${name}  —  ${money(item.lineTotalCents)}`,
      ...item.personalisation.map((p) => `      ${p.label}: ${p.value}`),
    ];
  });

  return deliver({
    to: order.email,
    subject: `Order ${order.number} — thank you`,
    body: [
      `Thank you — your order is confirmed.`,
      "",
      `Order number: ${order.number}`,
      "",
      "What's coming:",
      ...lines,
      "",
      `Subtotal:  ${money(order.subtotalCents)}`,
      `Shipping:  ${order.shippingCents === 0 ? "Free" : money(order.shippingCents)}`,
      `Total:     ${money(order.totalCents)}`,
      "",
      "Sending to:",
      `  ${order.shipName}`,
      `  ${order.shipLine1}`,
      ...(order.shipLine2 ? [`  ${order.shipLine2}`] : []),
      `  ${order.shipCity}${order.shipRegion ? `, ${order.shipRegion}` : ""} ${order.shipPostalCode}`,
      `  ${order.shipCountry}`,
      "",
      "Everything is made by hand in small batches, so allow a little time",
      "before it ships. You'll hear from us when it's on its way.",
      "",
      `— ${site.name}`,
    ].join("\n"),
  });
}

/**
 * The shop's own copy of an order.
 *
 * Sent separately from the customer receipt rather than as a BCC, so the two
 * can say different things — this one leads with what has to be made, and
 * carries the internal reference rather than reassurance.
 */
export async function sendShopOrderAlert(
  order: OrderForEmail,
): Promise<DeliveryResult> {
  const lines = order.items.flatMap((item) => {
    const name = item.variantLabel
      ? `${item.productName} — ${item.variantLabel}`
      : item.productName;
    return [
      `  ${item.quantity} x ${name}`,
      // Personalisation is indented and called out because getting it wrong
      // means remaking the piece.
      ...item.personalisation.map((p) => `      >> ${p.label}: ${p.value}`),
    ];
  });

  const personalised = order.items.some((i) => i.personalisation.length > 0);

  return deliver({
    to: shopOrderInbox(),
    subject: `New order ${order.number} — ${money(order.totalCents)}${personalised ? " (personalised)" : ""}`,
    body: [
      `Order ${order.number}`,
      `Paid: ${money(order.totalCents)}  (goods ${money(order.subtotalCents)}, shipping ${money(order.shippingCents)})`,
      `Customer: ${order.email}`,
      "",
      "To make:",
      ...lines,
      "",
      ...(personalised
        ? ["** This order includes personalisation — check the values above. **", ""]
        : []),
      `Ship (${order.shippingMethod ?? "standard"}):`,
      `  ${order.shipName}`,
      `  ${order.shipLine1}`,
      ...(order.shipLine2 ? [`  ${order.shipLine2}`] : []),
      `  ${order.shipCity}${order.shipRegion ? `, ${order.shipRegion}` : ""} ${order.shipPostalCode}`,
      `  ${order.shipCountry}`,
      "",
      `Manage: ${baseUrl()}/admin/orders`,
    ].join("\n"),
  });
}

type ShippedOrder = OrderForEmail & {
  carrier: string | null;
  trackingNumber: string | null;
  trackingUrl: string | null;
};

/** Sent when the maker marks an order shipped from the admin. */
export async function sendOrderShipped(
  order: ShippedOrder,
): Promise<DeliveryResult> {
  const tracking = order.trackingNumber
    ? [
        "",
        `${order.carrier ?? "Tracking"}: ${order.trackingNumber}`,
        ...(order.trackingUrl ? [order.trackingUrl] : []),
      ]
    : [];

  return deliver({
    to: order.email,
    subject: `Order ${order.number} is on its way`,
    body: [
      "Good news — your order has shipped.",
      "",
      `Order number: ${order.number}`,
      ...tracking,
      "",
      "Going to:",
      `  ${order.shipName}`,
      `  ${order.shipLine1}`,
      ...(order.shipLine2 ? [`  ${order.shipLine2}`] : []),
      `  ${order.shipCity}${order.shipRegion ? `, ${order.shipRegion}` : ""} ${order.shipPostalCode}`,
      "",
      `— ${site.name}`,
    ].join("\n"),
  });
}

/** Sent when the maker starts work — the question customers ask most. */
export async function sendOrderInProduction(
  order: OrderForEmail,
): Promise<DeliveryResult> {
  return deliver({
    to: order.email,
    subject: `Order ${order.number} is being made`,
    body: [
      "Your order has moved to the bench and is being made now.",
      "",
      `Order number: ${order.number}`,
      "",
      "You'll hear from us again when it ships.",
      "",
      `— ${site.name}`,
    ].join("\n"),
  });
}

/** Used by the setup check below and anything that wants to report status. */
export function emailProvider(): "resend" | "console" {
  return process.env.RESEND_API_KEY ? "resend" : "console";
}
