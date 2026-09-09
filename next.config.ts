import { loadEnvConfig } from "@next/env";
import type { NextConfig } from "next";

// next.config is evaluated early, so pull in .env* explicitly before reading
// anything out of process.env below.
loadEnvConfig(process.cwd());

/**
 * Hosts allowed to load /_next/* in development.
 *
 * This matters more than it looks: Next's dev server blocks cross-origin
 * requests to those paths, the HMR websocket included, and when that socket is
 * refused the Turbopack dev bootstrap never finishes — React never hydrates, so
 * the page renders from server HTML and then nothing is interactive.
 *
 * Add the public domain via SITE_DEV_ORIGINS in .env.local (comma separated)
 * rather than editing this list.
 */
const devOrigins = [
  "localhost",
  "127.0.0.1",
  "10.0.0.103", // LAN
  "100.77.38.45", // Tailscale
  "cody-linux-pc.tailf12b5e.ts.net", // Tailscale MagicDNS
  "24.108.198.130", // public IP (port 80 forwarded)
  ...(process.env.SITE_DEV_ORIGINS ?? "")
    .split(/[,\s]+/)
    .map((h) => h.trim())
    .filter(Boolean),
];

const nextConfig: NextConfig = {
  // There are stray lockfiles in the parent github/ folder; pin the root so
  // Turbopack doesn't guess wrong.
  turbopack: {
    root: __dirname,
  },
  allowedDevOrigins: devOrigins,
};

export default nextConfig;
