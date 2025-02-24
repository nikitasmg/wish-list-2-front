import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  /* config options here */
  images: {
    remotePatterns:[
      {
        hostname: "localhost",
      },
      {
        hostname: "get-my-wishlist.ru",
      },
      {
        hostname: "minio",
      }
    ]
  }
};

export default nextConfig;
