import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      // Cloudflare R2 — assets bucket (products, banners, categories)
      {
        protocol: "https",
        hostname: "*.r2.cloudflarestorage.com",
      },
      // Custom CDN domains (set in env)
      {
        protocol: "https",
        hostname: "assets.lotusmart.com",
      },
      {
        protocol: "https",
        hostname: "profiles.lotusmart.com",
      },
      // OAuth avatars
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
