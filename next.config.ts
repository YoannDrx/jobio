import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

// Content Security Policy directives
const cspDirectives = [
  "default-src 'self'",
  // Next.js requires 'unsafe-inline' for inline scripts; 'unsafe-eval' only in dev for HMR
  `script-src 'self' 'unsafe-inline' ${isDev ? "'unsafe-eval'" : ""} https://js.stripe.com`,
  // Tailwind/Shadcn inject inline styles
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://*.vercel-storage.com https://avatars.githubusercontent.com https://lh3.googleusercontent.com",
  "font-src 'self'",
  `connect-src 'self' https://eu.posthog.com https://us.posthog.com https://api.stripe.com https://*.vercel-storage.com ${isDev ? "ws://localhost:* http://localhost:*" : ""}`,
  "frame-src 'self' https://js.stripe.com https://hooks.stripe.com",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "upgrade-insecure-requests",
].join("; ");

const nextConfig: NextConfig = {
  experimental: {
    authInterrupts: true,
  },
  cacheComponents: true,
  typedRoutes: true,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Content-Security-Policy",
            value: cspDirectives,
          },
        ],
      },
    ];
  },
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
