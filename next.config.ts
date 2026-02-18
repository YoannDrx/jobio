import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    authInterrupts: true,
  },
  cacheComponents: true,
  typedRoutes: true,
  async redirects() {
    return [
      {
        source: "/app",
        destination: "/job",
        permanent: true,
      },
      {
        source: "/app/:path*",
        destination: "/job/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
