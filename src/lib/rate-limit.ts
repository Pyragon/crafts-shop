import "server-only";
import { headers } from "next/headers";
import { db } from "./db";

/**
 * Fixed-window rate limiting.
 *
 * The per-account lockout in `auth.ts` stops someone guessing many passwords
 * against one account. It does nothing about the opposite shape of attack —
 * one common password tried against thousands of accounts — because each
 * account only ever sees a single failure. That is what this covers.
 *
 * A fixed window can allow up to 2x the limit across a window boundary. A
 * sliding window would be tighter, but it needs a row per attempt; for a shop
 * this size the extra precision is not worth the write volume.
 */

export type RateLimitResult = {
  allowed: boolean;
  /** Seconds until the window resets. 0 when allowed. */
  retryAfter: number;
};

export const LIMITS = {
  /** Failed sign-ins from one address. Generous: households share addresses. */
  loginPerIp: { limit: 25, windowMs: 15 * 60 * 1000 },
  /** New accounts from one address. */
  registerPerIp: { limit: 5, windowMs: 60 * 60 * 1000 },
  /** Reset requests from one address — each one sends an email. */
  resetPerIp: { limit: 5, windowMs: 60 * 60 * 1000 },
  /** Reset requests for one address, so nobody can be mail-bombed. */
  resetPerEmail: { limit: 3, windowMs: 60 * 60 * 1000 },
  /** Verification re-sends for one account. */
  resendPerUser: { limit: 3, windowMs: 60 * 60 * 1000 },
} as const;

/**
 * The caller's address.
 *
 * Behind Cloudflare, `cf-connecting-ip` is authoritative. Reaching the origin
 * directly, these headers can be forged — the fix for that is a firewall
 * limiting port 443 to Cloudflare's ranges, which is noted in SECURITY.md.
 * Rate limiting is defence in depth, not the only defence.
 */
export async function clientIp(): Promise<string> {
  const h = await headers();
  return (
    h.get("cf-connecting-ip")?.trim() ||
    h.get("x-real-ip")?.trim() ||
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}

let lastSweep = 0;

/** Drops expired rows now and then so the table cannot grow without bound. */
async function sweep(): Promise<void> {
  const now = Date.now();
  if (now - lastSweep < 5 * 60 * 1000) return;
  lastSweep = now;
  await db.rateLimit
    .deleteMany({ where: { resetAt: { lt: new Date() } } })
    .catch(() => {});
}

/**
 * Counts one hit against `key` and says whether it is allowed.
 *
 * Call this only for attempts that should count — a failed sign-in, not a
 * successful one — or normal use burns the budget.
 */
export async function consume(
  key: string,
  { limit, windowMs }: { limit: number; windowMs: number },
): Promise<RateLimitResult> {
  await sweep();

  const now = new Date();
  const existing = await db.rateLimit.findUnique({ where: { key } });

  if (!existing || existing.resetAt <= now) {
    const resetAt = new Date(now.getTime() + windowMs);
    await db.rateLimit.upsert({
      where: { key },
      create: { key, count: 1, resetAt },
      update: { count: 1, resetAt },
    });
    return { allowed: true, retryAfter: 0 };
  }

  if (existing.count >= limit) {
    return {
      allowed: false,
      retryAfter: Math.max(
        1,
        Math.ceil((existing.resetAt.getTime() - now.getTime()) / 1000),
      ),
    };
  }

  await db.rateLimit.update({
    where: { key },
    data: { count: { increment: 1 } },
  });
  return { allowed: true, retryAfter: 0 };
}

/** Reads a limit without counting against it. */
export async function peek(
  key: string,
  { limit }: { limit: number },
): Promise<RateLimitResult> {
  const existing = await db.rateLimit.findUnique({ where: { key } });
  const now = new Date();
  if (!existing || existing.resetAt <= now || existing.count < limit) {
    return { allowed: true, retryAfter: 0 };
  }
  return {
    allowed: false,
    retryAfter: Math.max(
      1,
      Math.ceil((existing.resetAt.getTime() - now.getTime()) / 1000),
    ),
  };
}

/** Clears a key — used after a successful sign-in. */
export async function reset(key: string): Promise<void> {
  await db.rateLimit.deleteMany({ where: { key } }).catch(() => {});
}

/** "12 minutes" / "45 seconds", for messages people actually read. */
export function describeWait(seconds: number): string {
  if (seconds < 90) return `${seconds} second${seconds === 1 ? "" : "s"}`;
  const minutes = Math.ceil(seconds / 60);
  return `${minutes} minute${minutes === 1 ? "" : "s"}`;
}
