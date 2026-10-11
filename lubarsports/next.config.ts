import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // The repository root has its own package.json; the app lives here.
  outputFileTracingRoot: path.join(__dirname),

  eslint: {
    // Lint runs separately (npm run lint); style warnings should not block a deploy.
    ignoreDuringBuilds: true,
  },

  // Addresses from the old site, so bookmarks and shared links keep working.
  async redirects() {
    return [
      { source: "/league/:slug", destination: "/leagues/:slug", permanent: true },
      { source: "/pool", destination: "/leagues#pool", permanent: true },
      { source: "/darts", destination: "/leagues#darts", permanent: true },
      { source: "/dominoes", destination: "/leagues#dominoes", permanent: true },
      { source: "/fixtures/:slug", destination: "/fixtures?league=:slug", permanent: true },
      { source: "/menu", destination: "/", permanent: true },
      { source: "/login", destination: "/admin/login", permanent: true },
      { source: "/results-input", destination: "/admin/results", permanent: true },
      { source: "/admin-area", destination: "/admin", permanent: true },
      { source: "/admin-management", destination: "/admin/users", permanent: true },
    ];
  },

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
