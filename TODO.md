# MaBrown's Creations — Build Roadmap

Working through these **one at a time**, in order. Each phase ends with something
testable in a browser (including on a phone).

Legend: `[ ]` todo · `[~]` in progress · `[x]` done · `[?]` needs a decision from Cody

---

## Phase 0 — Foundation & base website  ✅ COMPLETE

- [x] Install Node.js LTS (v24.20.0, to `~/.local/lib/node`, no sudo needed)
- [x] Scaffold Next.js 16 + React 19 + TypeScript + Tailwind v4 (App Router, `src/`)
- [x] Central brand/site config (name, tagline, contact, socials) in one file
- [x] Design system: colour palette, fonts, spacing, base typography
- [x] Root layout: `<html lang>`, font loading, skip-link, base metadata
- [x] Header with desktop nav + working mobile hamburger menu
- [x] Footer with nav, contact, newsletter placeholder
- [x] Homepage: hero, featured products, blog teaser, about strip
- [~] Mobile-first responsive pass (360px → 1440px+) — built mobile-first, awaiting real-device check
- [x] Dev server reachable from phone — running on `0.0.0.0:80`
- [x] Placeholder pages for every nav route + custom 404 (so nothing dead-ends)
- [x] `git init`, first commit, pushed to Pyragon/crafts-shop (SSH auth set up)

## Phase 0.5 — Pre-launch gate  ✅ COMPLETE

- [x] `/coming-soon` page (standalone, no shop chrome, `noindex`)
- [x] Gate everyone except allowed IPs (loopback / LAN / tailnet)
- [x] `?preview=<token>` cookie bypass for phones and Cloudflare
- [x] `SITE_LOCKED=false` launch switch, restores static prerendering
- [ ] Wire the notify-me form to a real mailing list (with Phase 5)

## Phase 1 — Product catalog  ✅ COMPLETE

- [x] DB + ORM — **Prisma 7 + SQLite** (pinned to 7.10.0; `latest` on npm is an RC)
- [x] Schema: `Product`, `Category`, `ProductImage`, `ProductOption`, `ProductVariant`
- [x] Seed script — 4 categories, 12 published products, 1 draft kept as a guard
- [x] `/shop` listing: grid, category filter, sort, pagination (8/page)
- [x] `/shop/[slug]` detail: gallery, price, sale/stock states, related products
- [x] Category pages `/shop/category/[slug]`
- [x] Product search at `/search` (noindex — thin, duplicated content)
- [x] Empty / sold-out / not-found states; out-of-range pages 404 rather than soft-404

### Product variants  ✅ DONE

Decided and built. Colour, logo/design and size are all **variants of one
product**, not separate products — separate listings for near-identical items
split ranking signals between pages that then compete with each other.

- Up to three option axes per product (`Colour` × `Size` × …), values stored
  denormalised on the variant as `option1/2/3`
- Every product has at least one variant even with no options, so stock, price
  and SKU always live in exactly one place and the cart always points at a
  variant — no second code path
- Per-variant stock, optional per-variant price override and SKU
- Optional per-variant image, ready for uploads in Phase 7
- Admin "add variant" is a row insert; option axes are their own rows

**Option names and values are free text**, not a fixed list. An axis can be
"Glaze", "Size", "Design", "Lettering" — whatever the piece needs — and its
values are equally free ("Lettered" / "Not lettered"). Nothing is enumerated in
the schema, so the admin never needs a code change to add a new kind of choice.

### Personalisation  ✅ DONE

Separate from variants, because they solve different problems: a **variant** is
a fixed choice the shop decides in advance, while **personalisation** is
content only the customer can supply.

- `PersonalisationField` per product — label, help text, max length, required
- Per-variant `personalised` flag, so "Lettered" asks for a monogram while
  "Not lettered" shows nothing
- Values stored per cart line in `CartItemPersonalisation` (a real table, not
  encoded JSON, so the admin can search "who ordered a monogram")
- Cart lines keyed by `(cart, variant, personalisation digest)` — two monograms
  of the same variant are two lines, but adding the identical thing twice still
  just bumps the quantity
- Pricing stays on the variant; personalisation fields carry no money

Carried into Phase 4: personalisation must be copied onto the order, not
referenced, so a later edit to a product cannot rewrite what someone bought.

Still to add in Phase 7's admin UI:

- [ ] Define option axes on a product, then generate the variant grid from the
      chosen values
- [ ] Bulk stock editing across a product's variants
- [ ] Suggest previously-used values while typing — free text means "Indigo"
      and "indigo" would otherwise become two different options
- [ ] Define personalisation fields per product, and tick which variants ask
      for them

### Carried into Phase 6 (SEO)

- [ ] Canonical/noindex handling for sorted and filtered listing URLs —
      `?sort=` variants are duplicate content

## Phase 2 — Cart  ✅ COMPLETE

- [x] Cart persistence — httpOnly cookie token + DB rows, survives refresh
- [x] Add to cart / update quantity / remove line (Server Actions)
- [x] Cart drawer (slide-over) + full `/cart` page
- [x] Header cart badge with live item count
- [x] Subtotal + free-shipping threshold; shipping/tax deferred to checkout
- [x] Anonymous cart merges into the account on sign-in and sign-up
- [x] Stock validation server-side, per variant (clamps, never trusts the client)
- [x] Cart lines are per variant — two glazes of one mug are two lines

### Known limits

- Quantity changes need JavaScript. The cart page and drawer render correct
  contents server-side, and the header cart icon is a real link, so nothing is
  broken without JS — but the +/- controls are inert. Worth a plain form
  fallback if it ever matters.

## Phase 3 — Accounts & auth  ✅ COMPLETE

- [x] Auth approach — **hand-rolled sessions**, not Auth.js. v5 is still beta
      (5.0.0-beta.32) and v4 predates the App Router; after the Prisma RC, a
      beta under the login system was not worth it. Credentials-only auth is
      small, and Node ships scrypt, so this adds no dependency at all.
- [x] Register / login / logout
- [x] Password hashing (scrypt, from node:crypto) + per-account lockout
- [x] Password reset — full flow, tokens stored hashed, single use, 1h expiry
- [x] Email delivery via **Resend**; console fallback when no key is configured
- [x] Email verification — sent on signup, `/verify-email`, resend button,
      banner on the account page. Deliberately non-blocking
- [x] `/account` dashboard
- [x] `/account/orders` — empty state; real orders arrive with Phase 4
- [ ] `/account/orders/[id]` order detail — waiting on orders existing
- [x] `/account/addresses` — model and list; adding happens at checkout
- [x] Route protection via `requireUser()` in pages, not the proxy — the proxy
      runs on every request, and a session read there is a query per asset

### Security notes

- Passwords: scrypt, salted per user, parameters stored in the hash so they can
  be raised later without a migration
- Session tokens and reset tokens are stored **hashed** — a leaked database
  cannot be replayed or used to reset anyone's password
- Sign-in returns one message whether the email exists or not, and spends the
  same time either way, so the form cannot be used to enumerate accounts
- 8 failed attempts locks the account for 15 minutes; the counter lives in the
  database so a restart does not clear it
- A password reset destroys every existing session

### Known gaps

- Verification is intentionally not a barrier: it never blocks buying, and
  unverified accounts are never deleted. Reasoning in `SECURITY.md`
- [x] Per-address rate limiting on sign-in, registration, reset requests and
      verification re-sends — see `SECURITY.md`
- [ ] Firewall port 443 to Cloudflare's ranges, so forwarded IP headers can't
      be forged by hitting the origin directly

## Phase 4 — Checkout & orders  ✅ COMPLETE

- [x] Checkout: contact → address → delivery → payment, embedded Payment Element
- [x] Guest checkout — no account required
- [x] Flat shipping options; standard free over $75
- [x] Payments via **Stripe** (sandbox keys in place, verified end to end)
- [x] Order/OrderItem models, human order numbers (MB-2026-0001)
- [x] Stock decrement in a transaction, guarded so it cannot go negative
- [x] Order confirmation page
- [x] Order confirmation email via Resend
- [x] Webhook with signature verification, idempotent, exempt from the gate

### Shipping

Flat rates by destination zone rather than carrier-calculated. For small
parcels that is predictable, and it avoids an integration whose outage would
take checkout down.

> ### ⚠️ The rates below are invented placeholders
>
> They are not Canada Post rates and not derived from anything. No product
> records a weight or packed size, so no real rate can currently be computed.
> **They must be replaced before taking real money** — undercharging loses
> money on every order, overcharging loses the order.

| Zone | Standard | Express |
|---|---|---|
| Canada | $8.00, free over $75 | $18.00 |
| United States | $18.00 | $35.00 |
| International | $35.00 | $65.00 |

**Only Canada is enabled.** The other zones have rates defined but are not
offered, so enabling them is a one-line change with the pricing already
thought through. Previously the checkout offered the United States while
charging the Canadian rate — a US order would have shipped underpriced.

The free-shipping threshold is domestic only: express is never free, or the
threshold would subsidise the expensive option, and abroad the postage is too
large to give away. Unknown countries fall to the international zone, never
domestic, so a mistake never underprices.

- [ ] **Replace the placeholder rates with real figures.** Needs from MaBrown:
      - the origin postal code she posts from
      - typical packed weight and box size per product type (a mug is not a
        tea towel), which also means adding `weightGrams` and packed dimensions
        to `ProductVariant`
      - whether she has a Canada Post business account, or uses a reseller
        like Stallion Express or Chit Chats — the discounts are substantial
- [ ] Decide how rates are produced (see options below)
- [ ] Enable US and international zones when MaBrown is ready to post abroad
**Options for real rates, cheapest effort first:**

1. **Measure actual parcels and set flat bands.** Weigh and box a few typical
   orders, look up what Canada Post charges, add a margin. No integration, no
   dependency, no outage risk. What most small shops do, and probably right
   here. Needs revisiting when Canada Post raises rates, usually each January.
2. **Canada Post's published rate tables**, encoded as weight/zone bands. More
   accurate, still no runtime dependency, same annual maintenance.
3. **Canada Post Ship & Track API** for live rates. Accurate, and needs weight
   and dimensions per item plus a business account — and checkout then depends
   on their API being up, so it needs a fallback.
4. **An aggregator** (Stallion Express, Chit Chats, EasyPost, Shippo). Often
   materially cheaper than retail Canada Post for small parcels, which for a
   shop this size may matter more than rate accuracy.

`shippingCostCents` is the single place any of these would plug into.
- [ ] Customs/CN22 declarations will be needed before shipping internationally

### Order management data model

Built ready for the admin, so Phase 7 is UI over existing fields:

- **Payment and fulfilment are separate.** An order can be refunded after
  shipping, or paid and not yet started — one enum could not say both.
  - Payment: `PENDING` `PAID` `PARTIALLY_REFUNDED` `REFUNDED` `FAILED`
  - Fulfilment: `UNFULFILLED` `IN_PRODUCTION` `READY_TO_SHIP` `SHIPPED`
    `DELIVERED` `CANCELLED`
- `IN_PRODUCTION` exists because these are made to order — "have you started
  making it" is the question customers actually ask.
- Tracking: `carrier`, `trackingNumber`, `trackingUrl`, `shippedAt`,
  `deliveredAt`. The URL is stored rather than derived, because carriers change
  their URL formats and a stale pattern would break links on old orders.
- `internalNotes` — private to the shop, never shown to the customer.
- `OrderEvent` timeline: every status change, email and note, so the admin can
  answer "what happened to this order and when" without inferring it from
  scattered timestamps.

Emails ready to wire to those transitions: `sendOrderShipped` (with tracking)
and `sendOrderInProduction`. Only those two notify — nobody wants an email
saying their order moved to `READY_TO_SHIP`.

### Still to do on orders

- [ ] `/account/orders/[id]` detail page (list view exists)
- [ ] **Sales tax.** Not calculated, and the checkout says so. Canadian tax is
      destination-based with per-province rates and registration thresholds;
      guessing one rate would be worse than charging none. Stripe Tax is the
      likely answer. **Must be resolved before launch.**
- [ ] **Refunds from the admin must ask for a reason.** The reason is required,
      stored on `cancellationReason`, written to the order timeline, and shown
      to the customer in the notification — "your order was cancelled" with no
      reason generates a support email every single time. A full refund
      cancels the order; a partial one does not.
- [ ] Admin UI for the fulfilment fields below — the data model is ready
- [ ] Switch to live Stripe keys, and re-point the webhook at the live endpoint

## Phase 5 — Blog / journal

- [ ] Decide authoring: MDX files in repo vs. DB-backed posts editable in admin
- [ ] `Post` model / content pipeline, draft vs. published
- [ ] `/blog` index with pagination
- [ ] `/blog/[slug]` post page, cover image, author, reading time
- [ ] Tags / categories
- [ ] Related posts + "shop this post" product links
- [ ] RSS feed

## Phase 6 — SEO

- [ ] Per-page metadata via Next metadata API (title template, description, canonical)
- [ ] OpenGraph + Twitter card tags
- [ ] Dynamic OG image generation (`opengraph-image.tsx`)
- [ ] JSON-LD structured data:
  - [ ] `Organization` / `LocalBusiness` sitewide
  - [ ] `Product` + `Offer` + `AggregateRating` on product pages
  - [ ] `BreadcrumbList` on nested pages
  - [ ] `Article` on blog posts
- [ ] Dynamic `sitemap.xml` (products, categories, posts, static pages)
- [ ] `robots.txt`
- [ ] Semantic HTML + heading hierarchy audit
- [ ] All images via `next/image` with real alt text
- [ ] Core Web Vitals / Lighthouse pass (target 95+)
- [ ] Analytics  `[?]` Plausible / Umami / GA4?
- [ ] Google Search Console verification

## Phase 7 — Admin (so the shop can be run without touching code)

- [ ] Admin role on user model + `/admin` route protection
- [ ] Product CRUD with image upload
- [ ] Image storage  `[?]` local disk vs. S3/R2/Cloudinary
- [ ] Category management
- [ ] Blog post editor (rich text or markdown)
- [ ] Order management: list, detail, fulfilment status, tracking, refund with
      a required reason — the data model for all of this already exists
- [ ] Inventory / low-stock view
- [ ] Basic sales dashboard

### Shipping configuration

Rates currently live in `src/lib/shipping.ts` as constants, which means every
price change is a code edit and a deploy. They belong in the database, editable
from the admin, so MaBrown can react to a Canada Post increase herself.

Build it in this order — each step is useful on its own, and stopping after
step 1 or 2 would still be a working shop:

**1. Editable flat rates** (start here)

- [ ] Move zones, methods and rates into the database
- [ ] Admin screen: per zone, per method, set a price
- [ ] Enable/disable a destination zone, so opening the US is a toggle
- [ ] Configurable free-shipping threshold, and which zones it applies to
- [ ] Enable/disable individual methods (drop Express if it is never chosen)

**2. Weight-based bands**

- [ ] Add `weightGrams` and packed dimensions to `ProductVariant`, and a
      shop-wide origin postal code — nothing accurate is possible without these
- [ ] Rate table by weight band per zone, e.g. 0–500g, 500g–1kg, 1–2kg
- [ ] Per-product packaging allowance, so the box and padding are counted
- [ ] Show the computed parcel weight in the admin when reviewing an order

**3. Carrier-calculated rates**

- [ ] A provider interface so couriers are pluggable rather than hardcoded —
      Canada Post today, another tomorrow, without touching checkout
- [ ] Canada Post Ship & Track API (rating endpoint)
- [ ] Optionally an aggregator: Stallion Express, Chit Chats, EasyPost, Shippo.
      For small Canadian parcels these are often materially cheaper than retail
      Canada Post, which may matter more than rate precision
- [ ] Admin: choose which provider is live, per zone
- [ ] **Fallback to flat rates when the carrier API is slow or down.** Checkout
      must never fail because a courier's API is having a bad day — the cost of
      being a little wrong is far lower than the cost of not selling
- [ ] Cache quotes briefly, so a customer changing address does not fire a
      request per keystroke
- [ ] Carrier credentials in environment variables, not the database

**Notes worth keeping in mind**

- Rates are per *parcel*, not per item — a second mug costs far less to add
  than the first did. Any weight model needs to combine a cart into parcels,
  and splitting large orders across boxes is its own problem.
- Live quotes need a complete destination address, which the current checkout
  only has at the end. Either quote late, or ask for the postal code earlier.
- Whatever the source, **keep charging predictable**. A rate that jumps around
  between page loads reads as broken even when it is correct.

## Phase 8 — Production readiness

- [ ] Postgres migration path
- [ ] Environment/secret management, `.env.example`
- [x] HTTPS + real domain — mabrowns.ca / mabrown.ca, Full (strict)
- [x] Reverse proxy (Caddy) in front of Next
- [ ] Automated DB backups
- [ ] Move to a VPS for production (Cody's plan; retires the dynamic-IP problem)
- [ ] Error monitoring (Sentry)
- [ ] Accessibility audit (keyboard nav, contrast, screen reader)
- [ ] Legal pages: privacy, terms, returns/refunds, shipping policy
- [ ] Cookie/consent banner if required
- [ ] Deployment + process manager / systemd unit

---

---

## 🚀 Launch checklist

Everything that must happen **before the shop is open to real customers**.
Collected here because these were accumulating scattered across phases, and
each one is the kind of thing that is invisible until it costs money.

### Email

- [ ] **Tighten DMARC.** It is at `p=none`, which only monitors — receivers are
      told nothing about what to do with mail that fails. Before launch, read
      the reports, confirm the only senders are Resend and Cloudflare, then move
      to `p=quarantine` and later `p=reject`.
      Record: `_dmarc` → `v=DMARC1; p=none; rua=mailto:admin@mabrowns.ca`
      Cloudflare **DMARC Management** (free, needs Cloudflare DNS) charts these
      reports instead of mailing raw XML that nobody reads.
- [ ] **Rotate every credential pasted into a chat transcript.** All of these
      were shared in conversation and should be replaced before launch:
      - Resend API key
      - Stripe secret key (`sk_test_…` now; the live one must never be pasted
        anywhere)
      - Stripe webhook signing secret — roll it from Workbench → Webhooks →
        ⋯ → Roll secret, then update `.env.local`
      Rotating is a couple of clicks each; the risk of not doing it is that a
      transcript is a durable copy of a working credential.
- [ ] Delete or re-password the `admin@mabrowns.ca` account created by testing.
- [ ] Send a real order confirmation to a Gmail, Outlook and Yahoo address and
      confirm none land in spam.

### Serving

- [ ] Replace `next dev` with `next build && next start`. The dev server is
      slow, unoptimised and not built for public traffic.
- [ ] Remove the `no-store` header on `/_next/*` in `deploy/Caddyfile`.
      It exists because dev chunks reuse URLs; production assets are
      content-hashed and should be cached hard. Leaving it costs every visitor
      a full re-download on every page.
- [ ] Make `:80` redirect to HTTPS rather than proxying, and drop the port 80
      forward.
- [ ] Firewall port 443 to Cloudflare's published ranges, so the forwarded IP
      headers that rate limiting trusts cannot be forged.

### Data

- [ ] Move from SQLite to Postgres.
- [ ] Automated backups, and a restore actually tested — an untested backup is
      not a backup.

### Legal and trust

- [ ] Privacy policy, terms, returns/refunds, shipping policy.
- [ ] Cookie/consent banner if required.

### Payments

- [ ] Swap Stripe sandbox keys for live keys, and create a live-mode webhook
      endpoint — the signing secret differs between sandbox and live.
- [ ] Resolve sales tax before taking real money.
- [ ] **Replace the placeholder shipping rates.** They are invented numbers,
      not Canada Post rates. Every order at launch would be mispriced.

### The switch itself

- [ ] `SITE_LOCKED=false` — this is the actual go-live. Everything above should
      be done first, because this is the moment strangers can reach it.
- [ ] Verify the sitemap and `robots.txt` allow indexing (the gate sends
      `noindex` on every page while locked).
- [ ] Confirm `NEXT_PUBLIC_SITE_URL` is the public URL **before** running
      `next build` — it is inlined at build time, and a stale value silently
      publishes canonical tags and email links pointing at localhost.
- [ ] Submit the sitemap in Google Search Console.

---

## Cross-cutting (ongoing, not a phase)

- [ ] Mobile-first at every step — every feature checked on a phone before it's "done"
- [ ] Accessibility as we go, not bolted on at the end
- [ ] Keep `README.md` current with setup + run instructions

---

## Remote testing setup

Cody is working remotely; **port 80 is already forwarded** to this machine.

Blocker: unprivileged processes can't bind ports below 1024 here, and this
session has no passwordless sudo. One-time fix Cody runs:

```
sudo sysctl -w net.ipv4.ip_unprivileged_port_start=80
```

To make it survive reboots:

```
echo 'net.ipv4.ip_unprivileged_port_start=80' | sudo tee /etc/sysctl.d/99-unprivileged-port80.conf
```

Useful addresses for this machine:

| Where            | Address              |
|------------------|----------------------|
| LAN              | `10.0.0.103`         |
| Tailscale        | `100.77.38.45`       |
| Public / phone   | forwarded port 80    |

- [x] Run the sysctl command above
- [x] `npm run dev:public` bound to `0.0.0.0:80` and serving
- [x] Public access via Cloudflare at https://mabrowns.ca (port 80 forwarded)
- [x] Caddy terminating TLS with Cloudflare Origin CA certs for both domains
- [x] Cloudflare SSL mode set to Full (strict) on both zones, verified end to end
- [ ] Serve `next build && next start` instead of `next dev` before launch

---

## Open decisions

| # | Question | Status |
|---|----------|--------|
| 1 | Real shop name — **MaBrown's Creations** | done |
| 2 | Payment provider — Stripe assumed | open |
| 3 | Email provider — **Resend**, sending as noreply@mabrowns.ca | done |
| 4 | Blog authoring: MDX in repo vs. admin editor | open |
| 5 | Image hosting for product photos | open |
| 6 | Domains — **mabrowns.ca** (canonical) + **mabrown.ca** (301s to it) | done |
| 7 | Analytics provider | open |
