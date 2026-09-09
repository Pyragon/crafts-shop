import "server-only";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies, headers } from "next/headers";
import { cache } from "react";
import type { Role, TokenType } from "@prisma/client";
import { db } from "./db";
import { fakeVerify, hashPassword, verifyPassword } from "./password";
import { mergeCartIntoUser } from "./cart";
import { sendEmailVerification } from "./email";

export const SESSION_COOKIE = "mbc-session";
const SESSION_DAYS = 30;
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;
const TOKEN_TTL_HOURS = { EMAIL_VERIFICATION: 48, PASSWORD_RESET: 1 };

export type SessionUser = {
  id: string;
  email: string;
  name: string | null;
  role: Role;
  emailVerified: boolean;
};

/** Session tokens are stored hashed, so a leaked database can't be replayed. */
function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * The signed-in user, or null.
 *
 * `cache` dedupes this across a single render — layout, page and any component
 * can all ask without repeating the query.
 */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await db.session.findUnique({
    where: { token: hashToken(token) },
    select: {
      expiresAt: true,
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          emailVerifiedAt: true,
        },
      },
    },
  });
  if (!session) return null;

  if (session.expiresAt.getTime() < Date.now()) {
    // Expired sessions are cleaned up lazily, on the next attempt to use them.
    await db.session
      .deleteMany({ where: { token: hashToken(token) } })
      .catch(() => {});
    return null;
  }

  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    role: session.user.role,
    emailVerified: session.user.emailVerifiedAt !== null,
  };
});

async function createSession(userId: string): Promise<void> {
  const token = randomBytes(32).toString("base64url");
  const headerList = await headers();

  await db.session.create({
    data: {
      token: hashToken(token),
      userId,
      expiresAt: new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000),
      userAgent: headerList.get("user-agent")?.slice(0, 255) ?? null,
      ip:
        headerList.get("cf-connecting-ip") ??
        headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ??
        null,
    },
  });

  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
    secure: process.env.NODE_ENV === "production",
  });
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) {
    await db.session
      .deleteMany({ where: { token: hashToken(token) } })
      .catch(() => {});
  }
  store.delete(SESSION_COOKIE);
}

export type AuthResult = { ok: true } | { ok: false; error: string };

function normaliseEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function validatePassword(password: string): string | null {
  if (password.length < 10) {
    return "Password must be at least 10 characters.";
  }
  if (password.length > 200) {
    return "Password must be 200 characters or fewer.";
  }
  return null;
}

export async function registerUser(
  emailRaw: string,
  password: string,
  name?: string,
): Promise<AuthResult> {
  const email = normaliseEmail(emailRaw);
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return { ok: false, error: "That doesn't look like an email address." };
  }
  const passwordProblem = validatePassword(password);
  if (passwordProblem) return { ok: false, error: passwordProblem };

  const existing = await db.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (existing) {
    // Deliberately the same wording as a successful signup would produce, so
    // the form cannot be used to discover which emails have accounts.
    return { ok: false, error: "That email is already registered. Try signing in." };
  }

  const user = await db.user.create({
    data: {
      email,
      name: name?.trim() || null,
      passwordHash: await hashPassword(password),
    },
    select: { id: true, email: true, name: true },
  });

  await sendVerificationEmail(user.id, user.email, user.name);

  // Signed in immediately, unverified. Verification never blocks buying:
  // checkout also allows guests, so turning away a registered-but-unverified
  // customer while waving strangers through would be incoherent.
  await mergeCartIntoUser(user.id);
  await createSession(user.id);
  return { ok: true };
}

export async function sendVerificationEmail(
  userId: string,
  email: string,
  name: string | null,
): Promise<void> {
  const token = await issueToken(userId, "EMAIL_VERIFICATION");
  await sendEmailVerification(email, name, token);
}

export async function verifyEmail(
  token: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const consumed = await consumeToken(token, "EMAIL_VERIFICATION");
  if (!consumed.ok) return { ok: false, error: consumed.error };

  await db.user.update({
    where: { id: consumed.userId },
    data: { emailVerifiedAt: new Date() },
  });
  return { ok: true };
}

export async function loginUser(
  emailRaw: string,
  password: string,
): Promise<AuthResult> {
  const email = normaliseEmail(emailRaw);
  const user = await db.user.findUnique({
    where: { email },
    select: {
      id: true,
      passwordHash: true,
      failedLoginAttempts: true,
      lockedUntil: true,
    },
  });

  const genericError = "Email or password is incorrect.";

  if (!user) {
    // Spend the same time as a real check so the response time doesn't reveal
    // whether the account exists.
    await fakeVerify();
    return { ok: false, error: genericError };
  }

  if (user.lockedUntil && user.lockedUntil.getTime() > Date.now()) {
    const minutes = Math.ceil(
      (user.lockedUntil.getTime() - Date.now()) / 60000,
    );
    return {
      ok: false,
      error: `Too many attempts. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`,
    };
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    const attempts = user.failedLoginAttempts + 1;
    await db.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: attempts,
        lockedUntil:
          attempts >= MAX_FAILED_ATTEMPTS
            ? new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000)
            : null,
      },
    });
    return { ok: false, error: genericError };
  }

  await db.user.update({
    where: { id: user.id },
    data: { failedLoginAttempts: 0, lockedUntil: null },
  });

  // Fold whatever they had in the anonymous cart into their account before the
  // session changes, so nothing is lost by signing in.
  await mergeCartIntoUser(user.id);
  await createSession(user.id);
  return { ok: true };
}

/**
 * Issues a single-use token. Only its hash is stored, so the database alone
 * cannot be used to verify an email or reset a password.
 *
 * Returns the raw token for the caller to put in a link.
 */
export async function issueToken(
  userId: string,
  type: TokenType,
): Promise<string> {
  const token = randomBytes(32).toString("base64url");
  const hours = TOKEN_TTL_HOURS[type];

  // One live token per purpose: issuing a new one invalidates the old.
  await db.verificationToken.deleteMany({ where: { userId, type, usedAt: null } });
  await db.verificationToken.create({
    data: {
      tokenHash: hashToken(token),
      userId,
      type,
      expiresAt: new Date(Date.now() + hours * 60 * 60 * 1000),
    },
  });
  return token;
}

export async function consumeToken(
  token: string,
  type: TokenType,
): Promise<{ ok: true; userId: string } | { ok: false; error: string }> {
  const record = await db.verificationToken.findUnique({
    where: { tokenHash: hashToken(token) },
    select: { id: true, userId: true, type: true, expiresAt: true, usedAt: true },
  });

  const invalid = { ok: false as const, error: "That link is invalid or has expired." };
  if (!record || record.type !== type || record.usedAt) return invalid;
  if (record.expiresAt.getTime() < Date.now()) return invalid;

  await db.verificationToken.update({
    where: { id: record.id },
    data: { usedAt: new Date() },
  });
  return { ok: true, userId: record.userId };
}

export async function resetPassword(
  token: string,
  password: string,
): Promise<AuthResult> {
  const problem = validatePassword(password);
  if (problem) return { ok: false, error: problem };

  const consumed = await consumeToken(token, "PASSWORD_RESET");
  if (!consumed.ok) return { ok: false, error: consumed.error };

  await db.user.update({
    where: { id: consumed.userId },
    data: {
      passwordHash: await hashPassword(password),
      failedLoginAttempts: 0,
      lockedUntil: null,
    },
  });

  // Every existing session is dropped: if the reset was prompted by a
  // compromise, leaving the attacker signed in defeats the point.
  await db.session.deleteMany({ where: { userId: consumed.userId } });
  await createSession(consumed.userId);
  return { ok: true };
}

/** Constant-time equality for opaque strings of the same length. */
export function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
}
