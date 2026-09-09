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

## Phase 1 — Product catalog  ← NEXT

- [ ] Choose DB + ORM — planning on **Prisma + SQLite** for dev, Postgres for prod
- [ ] Schema: `Product`, `Category`, `ProductImage`, `ProductVariant`
- [ ] Seed script with realistic sample craft products
- [ ] `/shop` listing: grid, category filter, sort, pagination
- [ ] `/shop/[slug]` product detail: image gallery, price, stock, add-to-cart
- [ ] Category pages `/shop/category/[slug]`
- [ ] Product search
- [ ] Empty / out-of-stock / not-found states

## Phase 2 — Cart

- [ ] Cart persistence model (cookie-backed cart id + DB rows, survives refresh)
- [ ] Add to cart / update quantity / remove line
- [ ] Cart drawer (slide-over) + full `/cart` page
- [ ] Header cart badge with live item count
- [ ] Subtotal, shipping estimate, tax placeholder
- [ ] Merge anonymous cart into user cart on login
- [ ] Stock validation on quantity change

## Phase 3 — Accounts & auth

- [ ] Pick auth approach — leaning **Auth.js (NextAuth) v5** with credentials + optional Google
- [ ] Register / login / logout
- [ ] Password hashing (argon2 or bcrypt), rate limiting on login
- [ ] Email verification + password reset  `[?]` needs an email provider (Resend? SMTP?)
- [ ] `/account` dashboard
- [ ] `/account/orders` order history list
- [ ] `/account/orders/[id]` order detail
- [ ] `/account/addresses` saved addresses
- [ ] Route protection middleware

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
- [ ] HTTPS + real domain  `[?]` does Cody have a domain yet?
- [ ] Reverse proxy (Caddy/nginx) in front of Next
- [ ] Automated DB backups
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
- [ ] Switch Cloudflare SSL to Full (strict) with an origin cert — **required before payments**
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
| 6 | Domain name — **mabrowns.ca**, live via Cloudflare | done |
| 7 | Analytics provider | open |
