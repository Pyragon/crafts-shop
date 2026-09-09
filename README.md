# MaBrown's Creations

Storefront for MaBrown's Creations, an arts-and-crafts shop: catalogue, cart, accounts with order history,
a blog/journal, and SEO that actually works.

Built with **Next.js 16 (App Router) · React 19 · TypeScript · Tailwind v4**.
Pages render on the server, so crawlers get complete HTML — React here does
not cost us SEO.

See [`TODO.md`](./TODO.md) for the phased roadmap and open decisions, and
[`SECURITY.md`](./SECURITY.md) for why the security-relevant parts are built
the way they are.

## Requirements

Node.js 24 LTS. It's installed to `~/.local/lib/node` and already on `PATH`
via `~/.bashrc`:

```sh
node -v   # v24.20.0
```

## Running it

```sh
npm install        # runs `prisma generate` via postinstall
npm run db:migrate # create/apply migrations
npm run db:seed    # load sample catalogue
npm run dev        # http://localhost:3000
```

### Database

Prisma 7 with SQLite in development. Two things to know:

- **Prisma is pinned to 7.10.0.** npm's `latest` tag currently points at
  `8.0.0-rc`, so an unpinned install silently mixes an RC CLI with a stable
  client. Don't loosen it without checking `npm view prisma dist-tags`.
- **Prisma 7 moved the connection URL out of `schema.prisma`** into
  `prisma.config.ts`, and connects through a driver adapter
  (`@prisma/adapter-better-sqlite3`). `DATABASE_URL` lives in `.env`, which
  both Prisma and Next read.

```sh
npm run db:studio  # browse the data
npm run db:reset   # drop, re-migrate, re-seed
```

The seed leaves one product in `DRAFT` on purpose, as a standing check that
unpublished products never reach the storefront.

> **After changing the schema, restart the dev server.** The Prisma client is
> cached on `globalThis` to survive HMR, so a regenerated client is not picked
> up by a running process. The symptom is misleading: `Cannot read properties
> of undefined (reading 'create')`, because the cached client predates the new
> model.

Other scripts:

```sh
npm run build      # production build
npm run start      # serve the production build
npm run lint       # eslint
```

## Testing from a phone

Bind to all interfaces so other devices on the network can reach it:

```sh
npm run dev -- --hostname 0.0.0.0 --port 3000
```

| Where     | URL                        |
|-----------|----------------------------|
| This box  | `http://localhost:3000`    |
| LAN       | `http://10.0.0.103:3000`   |
| Tailscale | `http://100.77.38.45:3000` |

### Architecture

```
Cloudflare edge  ──TLS──>  Caddy (:80, :443)  ──HTTP──>  Next.js (127.0.0.1:3000)
```

Caddy terminates TLS with a Cloudflare Origin CA certificate. Next binds to
loopback only, so it is reachable exclusively through the proxy.

```sh
npm run dev:origin   # Next on 127.0.0.1:3000
npm run proxy        # Caddy on :80 and :443
```

`caddy reload --config deploy/Caddyfile` applies config changes with no
downtime (the admin API listens on localhost:2019).

> **Dev asset caching.** Next's dev CSS/JS chunks keep a *stable URL* while
> their contents change — the same `[root-of-the-server]__*.css` URL served
> 40KB early in a session and 43KB later. Anything that caches by URL (a
> browser, or Cloudflare) will therefore serve stale styles, and the symptom is
> baffling: a component that uses a newly-added utility class renders as if
> that class does not exist. This bit twice — a search icon that ignored its
> padding, and a cart drawer stuck on screen and unclickable.
>
> Caddy now sends `no-store` for `/_next/*` so it cannot recur, and drawer
> open/closed state is driven by **inline styles** rather than utility classes,
> so it cannot depend on the stylesheet being current. If something still looks
> wrong after a change, hard-refresh before debugging anything else.

> **Gotcha, and an expensive one.** Caddy deliberately strips
> `X-Forwarded-Proto` and sends the scheme as `X-Origin-Proto` instead. Next
> derives its request URLs from `X-Forwarded-Proto`; with `https` there, an
> *internal* rewrite looks cross-origin to it, because the origin server itself
> speaks plain HTTP on loopback. It then tries to proxy to
> `https://localhost:3000` and fails with `wrong version number`. The gate's
> rewrite to `/coming-soon` is the only thing that does this, so the symptom is
> that gated visitors hang while allowed ones are fine.
>
> Related: the rewritten request re-enters `proxy.ts`, so `/coming-soon` has to
> be let through explicitly or the gate rewrites it to itself forever.

### Public access

The site is served through Cloudflare at **https://mabrowns.ca**, with ports
80 and 443 forwarded from the router to this machine. **mabrown.ca** is a
typo-catching domain that 301s to the canonical one, preserving the path.
Each domain has its own Cloudflare Origin CA certificate; Caddy picks the
right one by SNI. Cloudflare terminates TLS at its
edge; the hop from Cloudflare to here is still plain HTTP, so the SSL/TLS mode
is Flexible. **That has to become Full (strict), with a certificate on the
origin, before the shop takes a single real payment.**

Any hostname the dev server is reached on must be listed in
`SITE_DEV_ORIGINS` (`.env.local`, comma separated) — otherwise Next blocks the
HMR websocket cross-origin, the dev bootstrap stalls, and the page renders but
never becomes interactive.

> Gotcha: `next.config.ts` reads that variable once at startup. Editing
> `.env.local` alone does not re-evaluate it — `touch next.config.ts` (or
> restart) after changing the list, or the old value silently stays in effect.

### Serving on port 80

Port 80 is forwarded to this machine, but Linux blocks unprivileged processes
from binding ports below 1024. Lower that threshold once:

```sh
sudo sysctl -w net.ipv4.ip_unprivileged_port_start=80
```

Make it survive reboots:

```sh
echo 'net.ipv4.ip_unprivileged_port_start=80' \
  | sudo tee /etc/sysctl.d/99-unprivileged-port80.conf
```

Then:

```sh
npm run dev:public   # binds 0.0.0.0:80
```

## Pre-launch gate

While `SITE_LOCKED` is not `"false"`, everyone sees `/coming-soon` instead of
the shop. Two ways to get through:

1. **By IP** — loopback, LAN (`10/8`, `192.168/16`, `172.16/12`) and the
   tailnet (`100.64/10`) are allowed by default. Override with
   `SITE_ALLOWED_IPS`.
2. **By preview token** — visit any URL once with `?preview=<SITE_PREVIEW_TOKEN>`.
   That sets an HttpOnly cookie good for six months and strips the token from
   the URL. This is the one to use on a phone over cellular or through
   Cloudflare, where the IP moves around.

The gated response carries `X-Robots-Tag: noindex, nofollow` so a placeholder
never gets indexed as the shop's real content.

**To launch:** set `SITE_LOCKED=false`. That also restores static prerendering
— while the gate is on, the root layout reads request headers to decide
whether to draw the shop chrome, which forces every page to render on demand.

> This is a "not open yet" sign, not access control. The forwarded IP headers
> it trusts can be spoofed by anyone hitting the origin directly instead of
> going through Cloudflare. Anything that must genuinely stay private needs
> real auth or a firewall limited to Cloudflare's ranges.

## Accounts

Hand-rolled session auth — no Auth.js. Passwords use `scrypt` from Node's
standard library, so there is no native dependency to compile.

- Session and reset tokens are stored hashed; the cookie holds the raw value
- Sign-out deletes the session row, so it takes effect immediately
- 5 failed sign-ins lock an account for 15 minutes
- Email verification is sent on signup but never blocks anything
- `requireUser()` guards pages; the proxy is deliberately not involved

**Email is not wired up.** Every message prints to the server console with its
link, so password reset can be tested end to end today. Choosing a provider
means filling in `deliver()` in `src/lib/email.ts` and nothing else.

## Layout

```
src/
  app/               routes (App Router)
    layout.tsx       shell: fonts, metadata, header/footer
    page.tsx         homepage
    globals.css      design tokens + base styles
  components/        Header, Footer, ProductCard, icons
  proxy.ts           pre-launch gate (Next 16's middleware convention)
  lib/
    site.ts          BRANDING — shop name, tagline, nav, socials
    db.ts            Prisma client singleton (server-only)
    catalog.ts       catalogue queries (always filtered to PUBLISHED)
    cart.ts          cart persistence; stock is enforced here, not client-side
    auth.ts          sessions, registration, sign-in, tokens
    password.ts      scrypt hashing
    require-auth.ts  page guards
    email.ts         transactional email (console stub for now)
    variants.ts      option/variant helpers — dependency-free, safe for clients
    swatch.ts        placeholder colours — dependency-free, safe for clients
    ip-allowlist.ts  CIDR matching for the gate
    format.ts        price/date formatting
    placeholder-data.ts   temporary content, replaced by the DB in Phase 1
```

### Branding

`src/lib/site.ts` is the single source of truth for the shop name, tagline,
description, nav and socials. Change a value there and it updates titles, OG
tags, header, footer and (later) emails.

## Conventions

- **Prices are integer cents.** Never floats — use `formatPrice()` to display.
- **Storefront queries go through `@/lib/catalog`**, which filters to
  `PUBLISHED` in one place. Don't query products directly from a page.
- **Never import `@/lib/db` from a client component.** It pulls
  `better-sqlite3` into the browser bundle and fails with an opaque
  module-not-found. `db.ts` imports `server-only` so this fails loudly and
  names the real cause. Shared pure helpers belong in their own module — see
  `swatch.ts`.
- **Every product has at least one variant**, even with no options. Stock,
  price overrides and SKUs live on the variant; the cart always references a
  variant id. That uniformity is deliberate — it removes the "does this product
  have variants?" branch from every code path.
- **Variants vs personalisation.** A variant is a fixed choice the shop
  decides in advance (glaze, size, design). Personalisation is free text only
  the customer can supply (a monogram). Variants carry the price; personalisation
  fields never do.
- **The cart is server-authoritative.** The client sends an id and a desired
  quantity; the server decides what happens against live stock, clamping
  rather than trusting.
- **Mobile first.** Every feature is checked at 360px before it's called done.
- Placeholder product artwork is a deterministic gradient derived from the
  slug; real photography arrives with uploads in Phase 7.
