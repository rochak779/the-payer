import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cache Components is off: every page reads the local JSON file per request, so the
  // previous model with `dynamic = "force-dynamic"` is simpler for this single-user demo.
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
