import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '100mb', // Increased to allow large video uploads
    },
  },
};

export default nextConfig;