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
- [~] Email delivery stubbed: messages print to the server console with their
      link, so flows are testable. `[?]` provider still open (Resend? SMTP?)
- [ ] Email verification — model and mail written, not yet enforced anywhere
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

- [ ] Email verification is not enforced — nothing yet depends on a verified
      address, so it can wait for the provider decision
- [ ] Rate limiting is per account, not per IP. One attacker spraying many
      accounts is not slowed down. Worth adding before launch.

## Phase 4 — Checkout & orders

- [ ] Checkout flow: contact → shipping address → delivery → payment → review
- [ ] Guest checkout (no forced account)
- [ ] Shipping options & rates
- [ ] Payments  `[?]` **Stripe** recommended — needs Cody's account + keys
- [ ] Order + OrderItem models, order number generation
- [ ] Stock decrement on successful payment (transactional)
- [ ] Order confirmation page
- [ ] Order confirmation email
- [ ] Webhook handling for async payment events

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
- [ ] Order management: list, detail, mark fulfilled, tracking numbers
- [ ] Inventory / low-stock view
- [ ] Basic sales dashboard

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
| 3 | Email provider for receipts & password resets | open |
| 4 | Blog authoring: MDX in repo vs. admin editor | open |
| 5 | Image hosting for product photos | open |
| 6 | Domains — **mabrowns.ca** (canonical) + **mabrown.ca** (301s to it) | done |
| 7 | Analytics provider | open |
