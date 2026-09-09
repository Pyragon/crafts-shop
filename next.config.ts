import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // There are stray lockfiles in the parent github/ folder; pin the root so
  // Turbopack doesn't guess wrong.
  turbopack: {
    root: __dirname,
  },

  // Next's dev server blocks cross-origin requests to /_next/* — including the
  // HMR websocket. When that socket is refused, the Turbopack dev bootstrap
  // never finishes, so React never hydrates: the page renders from server HTML
  // and then nothing is interactive. Every host this box is reached on has to
  // be listed, loopback included. Dev-only; ignored by `next build`.
  allowedDevOrigins: [
    "localhost",
    "127.0.0.1",
    "10.0.0.103", // LAN
    "100.77.38.45", // Tailscale
    "cody-linux-pc.tailf12b5e.ts.net", // Tailscale MagicDNS
    "24.108.198.130", // public IP (port 80 forwarded)
  ],
};

export default nextConfig;
