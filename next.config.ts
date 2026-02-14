import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'globalsymbols.com',
      },
    ],
    unoptimized: false,
  },
  // Enable React Strict Mode (helps with Fast Refresh)
  reactStrictMode: true,
};

export default nextConfig;
