import "server-only";
import { redirect } from "next/navigation";
import { getCurrentUser, type SessionUser } from "./auth";

/**
 * Guards a page, sending signed-out visitors to sign in and back again.
 *
 * Protection lives here rather than in proxy.ts on purpose: the proxy runs on
 * every request including assets, and checking a session there would mean a
 * database read per asset. Pages that need a user ask for one.
 */
export async function requireUser(returnTo: string): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(returnTo)}`);
  }
  return user;
}

export async function requireAdmin(returnTo: string): Promise<SessionUser> {
  const user = await requireUser(returnTo);
  if (user.role !== "ADMIN") {
    // Not "forbidden" — an admin URL shouldn't confirm it exists to a
    // signed-in customer poking at paths.
    redirect("/account");
  }
  return user;
}
