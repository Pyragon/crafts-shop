# MaBrown's Creations

Storefront for MaBrown's Creations, an arts-and-crafts shop: catalogue, cart, accounts with order history,
a blog/journal, and SEO that actually works.

Built with **Next.js 16 (App Router) · React 19 · TypeScript · Tailwind v4**.
Pages render on the server, so crawlers get complete HTML — React here does
not cost us SEO.

See [`TODO.md`](./TODO.md) for the phased roadmap and open decisions.

## Requirements

Node.js 24 LTS. It's installed to `~/.local/lib/node` and already on `PATH`
via `~/.bashrc`:

```sh
node -v   # v24.20.0
```

## Running it

```sh
npm install        # first time only
npm run dev        # http://localhost:3000
```

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

## Layout

```
src/
  app/               routes (App Router)
    layout.tsx       shell: fonts, metadata, header/footer
    page.tsx         homepage
    globals.css      design tokens + base styles
  components/        Header, Footer, ProductCard, icons
  lib/
    site.ts          BRANDING — shop name, tagline, nav, socials
    format.ts        price/date formatting
    placeholder-data.ts   temporary content, replaced by the DB in Phase 1
```

### Branding

`src/lib/site.ts` is the single source of truth for the shop name, tagline,
description, nav and socials. Change a value there and it updates titles, OG
tags, header, footer and (later) emails.

## Conventions

- **Prices are integer cents.** Never floats — use `formatPrice()` to display.
- **Mobile first.** Every feature is checked at 360px before it's called done.
- Placeholder product artwork is a deterministic gradient derived from the
  slug; real photography arrives with uploads in Phase 7.
