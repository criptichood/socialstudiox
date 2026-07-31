import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      config.watchOptions = {
        poll: 800, // Check for file modifications every 800ms
        aggregateTimeout: 300, // Wait 300ms after a change before rebuilding
        ignored: /node_modules/,
      };
    }
    return config;
  },
};

export default nextConfig;
