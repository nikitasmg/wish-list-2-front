import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      { hostname: "localhost" },
      { hostname: "get-my-wishlist.ru" },
      { hostname: "minio" },
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "**" },
    ]
  }
};

export default nextConfig;
