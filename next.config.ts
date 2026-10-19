import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The dev cache kept serving an old Tailwind stylesheet across restarts, so it stays off.
  experimental: {
    turbopackFileSystemCacheForDev: false,
  },
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
