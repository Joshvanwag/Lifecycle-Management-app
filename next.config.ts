import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: {
      bodySizeLimit: "55mb",
    },
    middlewareClientMaxBodySize: "55mb",
  },
};

export default nextConfig;
