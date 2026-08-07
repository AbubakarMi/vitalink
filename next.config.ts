import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Top-level in Next 16 (not experimental.*) — enables "use cache" and Partial
  // Prerendering together. See docs/superpowers/specs/2026-08-06-vitalink-frontend-architecture-design.md §7.
  cacheComponents: true,

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
    ],
  },

  // No rewrites() proxy to the backend: all backend calls happen server-to-server
  // (Server Actions, Server Components, Route Handlers) using an absolute
  // BACKEND_ORIGIN URL, with the __Host- session cookies relayed manually onto this
  // app's own responses. The browser only ever talks to this app's origin, never
  // the .NET backend directly — see lib/api/client.ts and lib/api/auth.ts, and
  // design doc §3.
};

export default nextConfig;
