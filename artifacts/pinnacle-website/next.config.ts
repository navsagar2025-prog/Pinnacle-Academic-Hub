import type { NextConfig } from "next";

const basePath = process.env.BASE_PATH?.replace(/\/$/, "") || "/pinnacle-website";

const nextConfig: NextConfig = {
  basePath,
  assetPrefix: basePath,
  images: {
    unoptimized: true,
  },
  experimental: {
    serverActions: {
      allowedOrigins: ["*"],
    },
  },
};

export default nextConfig;
