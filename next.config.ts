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
        hostname: "minio",
      }
    ]
  }
};

export default nextConfig;
