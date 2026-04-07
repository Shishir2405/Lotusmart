import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  async headers() {
    return [
      {
        // Security headers for all routes
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
  images: {
    remotePatterns: [
      // Cloudflare R2 — assets bucket (products, banners, categories)
      {
        protocol: "https",
        hostname: "*.r2.cloudflarestorage.com",
      },
      // R2 public dev URLs
      {
        protocol: "https",
        hostname: "pub-*.r2.dev",
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
      // Homepage/category placeholder images
      {
        protocol: "https",
        hostname: "images.unsplash.com",
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
