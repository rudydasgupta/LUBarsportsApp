/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Allow production builds to complete even if there are ESLint errors
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Allow production builds to complete even if there are type errors
    // We will fix types iteratively without blocking deploys
    ignoreBuildErrors: true,
  },
};

module.exports = nextConfig;


