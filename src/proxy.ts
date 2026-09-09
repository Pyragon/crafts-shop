import { NextResponse, type NextRequest } from "next/server";
import { isIpAllowed, parseRules } from "@/lib/ip-allowlist";

/**
 * Pre-launch gate.
 *
 * Everyone except an allowed client sees /coming-soon. Two ways to be allowed:
 *
 *  1. Source IP is in SITE_ALLOWED_IPS (loopback, LAN and the tailnet by
 *     default) — covers this machine and anything on the local network.
 *  2. The request carries the preview cookie, set by visiting any URL with
 *     ?preview=<SITE_PREVIEW_TOKEN> once. This is the one that works from a
 *     phone on cellular, where the IP changes constantly, and through
 *     Cloudflare.
 *
 * Turn the whole thing off at launch with SITE_LOCKED=false.
 *
 * Note on trust: the forwarded headers below can be spoofed by anyone who
 * reaches the origin directly rather than through Cloudflare. This gate is a
 * "not open for business yet" sign, not an access control. Anything that
 * genuinely must stay private needs real auth (Phase 3) or a firewall that
 * only admits Cloudflare's ranges.
 */

const PREVIEW_COOKIE = "mbc-preview";
const COMING_SOON_PATH = "/coming-soon";

const DEFAULT_ALLOWED = [
  "127.0.0.1/32",
  "::1/128",
  "10.0.0.0/8", // LAN
  "192.168.0.0/16", // LAN
  "172.16.0.0/12", // LAN
  "100.64.0.0/10", // Tailscale IPv4
  "fd7a:115c:a1e0::/48", // Tailscale IPv6
].join(",");

function clientIp(request: NextRequest): string | null {
  // Cloudflare's header is the trustworthy one once traffic goes through it.
  const cf = request.headers.get("cf-connecting-ip");
  if (cf) return cf.trim();

  const real = request.headers.get("x-real-ip");
  if (real) return real.trim();

  // Left-most entry is the original client; Next fills this in from the
  // socket for direct connections.
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();

  return null;
}

export default function proxy(request: NextRequest) {
  if (process.env.SITE_LOCKED === "false") return NextResponse.next();

  const url = request.nextUrl;

  // A rewritten request re-enters this proxy with the new path, so the
  // coming-soon page has to be let through explicitly. Without this the gate
  // rewrites /coming-soon to /coming-soon forever, Next tries to proxy to
  // itself, and the request hangs instead of returning anything.
  if (url.pathname === COMING_SOON_PATH) return NextResponse.next();

  const token = process.env.SITE_PREVIEW_TOKEN;

  // ?preview=<token> stores the cookie, then reloads without the query param
  // so the token doesn't linger in the address bar or get shared in a link.
  const supplied = url.searchParams.get("preview");
  if (supplied && token && supplied === token) {
    const clean = new URL(url);
    clean.searchParams.delete("preview");
    const response = NextResponse.redirect(clean);
    response.cookies.set(PREVIEW_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      // X-Origin-Proto is set by the reverse proxy; url.protocol is only
      // right when Next is exposed directly.
      secure:
        request.headers.get("x-origin-proto") === "https" ||
        url.protocol === "https:",
      maxAge: 60 * 60 * 24 * 180, // ~6 months
    });
    return response;
  }

  const hasCookie =
    !!token && request.cookies.get(PREVIEW_COOKIE)?.value === token;
  const allowedByIp = isIpAllowed(
    clientIp(request),
    parseRules(process.env.SITE_ALLOWED_IPS ?? DEFAULT_ALLOWED),
  );

  if (hasCookie || allowedByIp) return NextResponse.next();

  // Signal to the root layout that it should drop the shop chrome.
  const headers = new Headers(request.headers);
  headers.set("x-site-locked", "1");

  // The rewrite target must share an origin with the incoming request or Next
  // treats it as an external rewrite and tries to proxy to it over the network
  // — which fails behind a TLS-terminating proxy, because the forwarded
  // protocol says https while the origin server speaks plain HTTP. Cloning
  // nextUrl keeps scheme, host and port identical, so it stays internal.
  const target = request.nextUrl.clone();
  target.pathname = COMING_SOON_PATH;
  target.search = "";

  const response = NextResponse.rewrite(target, {
    request: { headers },
  });
  // Keep a placeholder out of the index; the real pages get crawled at launch.
  response.headers.set("x-robots-tag", "noindex, nofollow");
  return response;
}

export const config = {
  // Everything except Next's own assets, static files, and the Stripe webhook.
  //
  // The webhook must stay reachable while the shop is gated: Stripe is not a
  // browser, cannot hold a preview cookie, and its address is not in the
  // allowlist — gating it would silently swallow payment confirmations. It is
  // safe to exempt because it authenticates itself by signature, which is a
  // stronger check than the gate performs.
  matcher: [
    "/((?!_next/|api/stripe/|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml|woff2?)$).*)",
  ],
};
