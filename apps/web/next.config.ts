import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable standalone output for optimized Cloud Run deployment
  output: 'standalone',
};

export default nextConfig;
