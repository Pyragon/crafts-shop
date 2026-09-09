import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // There are stray lockfiles in the parent github/ folder; pin the root so
  // Turbopack doesn't guess wrong.
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
