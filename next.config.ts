import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Database drivers load native/wasm assets at runtime; keep them out of the bundle.
  serverExternalPackages: ["@electric-sql/pglite", "pg"],
  // Don't let `next dev` append its own block to our hand-written CLAUDE.md.
  agentRules: false,
};

export default nextConfig;
