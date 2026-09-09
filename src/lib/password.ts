import "server-only";
import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import type { ScryptOptions } from "node:crypto";
import { promisify } from "node:util";

// promisify loses the options overload, so restate the signature we use.
const scryptAsync = promisify(scrypt) as (
  password: string | Buffer,
  salt: string | Buffer,
  keylen: number,
  options: ScryptOptions,
) => Promise<Buffer>;

/**
 * Password hashing with scrypt from Node's standard library.
 *
 * scrypt is deliberately memory-hard, which is what makes it expensive to
 * attack with GPUs. Using it avoids a native dependency entirely — argon2id
 * would be marginally stronger, but every option needs compilation, and the
 * install-script friction in this environment is a real cost for a marginal
 * gain. The stored format carries its parameters, so upgrading later means
 * re-hashing on next login rather than a migration.
 *
 * Format: scrypt$N$r$p$<salt hex>$<hash hex>
 */

const N = 16384; // CPU/memory cost
const r = 8; // block size
const p = 1; // parallelism
const KEY_LENGTH = 64;
const SALT_LENGTH = 16;

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_LENGTH);
  const key = await scryptAsync(password.normalize("NFKC"), salt, KEY_LENGTH, {
    N,
    r,
    p,
    maxmem: 256 * 1024 * 1024,
  });
  return `scrypt$${N}$${r}$${p}$${salt.toString("hex")}$${key.toString("hex")}`;
}

export async function verifyPassword(
  password: string,
  stored: string,
): Promise<boolean> {
  const parts = stored.split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;

  const [, nRaw, rRaw, pRaw, saltHex, hashHex] = parts;
  const salt = Buffer.from(saltHex, "hex");
  const expected = Buffer.from(hashHex, "hex");

  const key = await scryptAsync(password.normalize("NFKC"), salt, expected.length, {
    N: Number(nRaw),
    r: Number(rRaw),
    p: Number(pRaw),
    maxmem: 256 * 1024 * 1024,
  });

  // Constant time: a fast "wrong" answer leaks how much of the hash matched.
  return key.length === expected.length && timingSafeEqual(key, expected);
}

/**
 * A dummy verification, run when no account exists for the submitted email.
 *
 * Without it, "no such user" returns instantly while "wrong password" takes as
 * long as a hash — which tells an attacker which emails are registered.
 */
export async function fakeVerify(): Promise<void> {
  await scryptAsync("no-such-user", randomBytes(SALT_LENGTH), KEY_LENGTH, {
    N,
    r,
    p,
    maxmem: 256 * 1024 * 1024,
  });
}
