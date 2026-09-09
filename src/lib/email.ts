import "server-only";
import { site } from "./site";

/**
 * Transactional email.
 *
 * No provider is wired up yet — that decision is still open (Resend vs SMTP),
 * and it blocks nothing: every message is logged to the server console with
 * its link, so the flows are fully testable today. Swapping in a provider means
 * filling in `deliver()` and nothing else.
 */

type Message = {
  to: string;
  subject: string;
  body: string;
};

async function deliver(message: Message): Promise<void> {
  // TODO: replace with the real provider once chosen.
  console.log(
    [
      "",
      "──────────────── EMAIL (not sent — no provider configured) ────────────────",
      `To:      ${message.to}`,
      `Subject: ${message.subject}`,
      "",
      message.body,
      "───────────────────────────────────────────────────────────────────────────",
      "",
    ].join("\n"),
  );
}

function baseUrl(): string {
  return site.url.replace(/\/$/, "");
}

export async function sendPasswordResetEmail(
  to: string,
  name: string | null,
  token: string,
): Promise<void> {
  const link = `${baseUrl()}/reset-password?token=${encodeURIComponent(token)}`;
  await deliver({
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
    ].join("\n"),
  });
}

export async function sendEmailVerification(
  to: string,
  name: string | null,
  token: string,
): Promise<void> {
  const link = `${baseUrl()}/verify-email?token=${encodeURIComponent(token)}`;
  await deliver({
    to,
    subject: `Confirm your email for ${site.name}`,
    body: [
      `Hello${name ? ` ${name}` : ""},`,
      "",
      "Confirm your email address to finish setting up your account:",
      "",
      link,
      "",
      "The link expires in 48 hours.",
    ].join("\n"),
  });
}
