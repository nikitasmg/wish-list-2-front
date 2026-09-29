import type { NextConfig } from 'next'
import createMDX from '@next/mdx'

const withMDX = createMDX({})

const nextConfig: NextConfig = {
  pageExtensions: ['js', 'jsx', 'ts', 'tsx', 'md', 'mdx'],
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
      { hostname: 'localhost' },
      { hostname: 'files.prosto-namekni.ru' },
      { hostname: 'minio' },
      { protocol: 'https', hostname: '**' },
      { protocol: 'http', hostname: '**' },
    ],
  },
}

export default withMDX(nextConfig)
