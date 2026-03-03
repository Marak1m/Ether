import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'upload.wikimedia.org',
      },
      {
        protocol: 'https',
        hostname: 's3.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: 's3.us-east-1.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: '*.s3.us-east-1.amazonaws.com',
      },
    ],
  },
};

export default nextConfig;
