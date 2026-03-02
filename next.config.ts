import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow serving manifest and service worker
  experimental: {
    appDir: true,
  },
  // If you want to add custom headers for manifest and service worker:
  async headers() {
    return [
      {
        source: "/manifest.json",
        headers: [{ key: "Content-Type", value: "application/manifest+json" }],
      },
      {
        source: "/service-worker.js",
        headers: [{ key: "Service-Worker-Allowed", value: "/" }],
      },
    ];
  },
};

export default nextConfig;
