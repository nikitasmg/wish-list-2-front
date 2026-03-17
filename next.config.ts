import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  async rewrites() {
    return [
      {
        source: '/minio/:path*',
        destination: 'http://localhost:9000/:path*',
      },
    ]
  },
  images: {
    remotePatterns: [
      { hostname: "localhost" },
      { hostname: "prosto-namekni.ru" },
      { hostname: "minio" },
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "**" },
    ]
  }
};

export default nextConfig;
