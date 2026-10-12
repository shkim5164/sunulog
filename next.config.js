/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // Local visitor data is never bundled into Vercel server functions.
    outputFileTracingExcludes: { "*": ["./.data/**/*"] },
  },
};

module.exports = nextConfig;
