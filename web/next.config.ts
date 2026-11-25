import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Off on purpose: in development React would run effects twice, so every lesson page
  // would connect two times and the server log would show two connections per page load.
  reactStrictMode: false,
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
