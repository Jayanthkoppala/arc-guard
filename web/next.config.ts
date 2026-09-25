import type { NextConfig } from "next";

// Static export: the app is client-only (wallet + public RPC), so any static host works.
const nextConfig: NextConfig = {
  output: "export",
  turbopack: { root: __dirname },
};

export default nextConfig;
