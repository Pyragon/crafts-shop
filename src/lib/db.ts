// Importing this from a client component pulls better-sqlite3 into the
// browser bundle and fails with an opaque module-not-found. This makes that
// mistake fail immediately, naming the real cause.
import "server-only";

import Database from "better-sqlite3";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@prisma/client";

/**
 * SQLite defaults to a rollback journal, where a writer locks out readers
 * entirely. One cart write was enough to make an unrelated page read time out
 * (`P1008`) after blocking for twelve seconds. WAL lets readers carry on while
 * a write is in flight, which is what a web app needs.
 *
 * `journal_mode` is a persistent property of the database file, but it is set
 * here rather than once by hand so a fresh clone or a `db:reset` gets it too.
 */
function enableWal(url: string) {
  if (!url.startsWith("file:")) return;
  try {
    const handle = new Database(url.slice("file:".length));
    try {
      handle.pragma("journal_mode = WAL");
    } finally {
      handle.close();
    }
  } catch {
    // Best effort. WAL needs mmap-backed shared memory, which NTFS, exFAT and
    // network mounts do not provide; falling back to the rollback journal is
    // slower under concurrency but correct. Not worth failing startup over.
  }
}

/**
 * Prisma 7 connects through a driver adapter rather than a URL in the schema.
 *
 * The client is cached on globalThis in development because Next's HMR
 * re-evaluates modules on every edit; without this each reload would open
 * another SQLite connection until the process ran out of file handles.
 */
const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

function createPrismaClient() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set — copy .env.example to .env and fill it in.",
    );
  }
  enableWal(url);
  return new PrismaClient({
    adapter: new PrismaBetterSqlite3({
      url,
      // Wait for a contended lock instead of failing the request outright.
      timeout: 10_000,
    }),
  });
}

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
