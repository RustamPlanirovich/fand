import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:3011/api/:path*',
      },
    ];
  },
  server: {
    port: 3010,
  },
};

export default nextConfig;
