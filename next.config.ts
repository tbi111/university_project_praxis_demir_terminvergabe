import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Eigene AGENTS.md behalten: Next.js soll beim Start keinen Block hineinschreiben.
  agentRules: false,
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
