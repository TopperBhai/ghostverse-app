import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable standalone output for Docker deployments
  // output: "standalone",

  // Allow images from any domain (for user avatars)
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },

  // Webpack config for Socket.io compatibility
  webpack: (config) => {
    config.externals = config.externals || [];
    // Socket.io needs these to be external in server context
    if (Array.isArray(config.externals)) {
      config.externals.push({
        bufferutil: "bufferutil",
        "utf-8-validate": "utf-8-validate",
      });
    }
    return config;
  },
};

export default nextConfig;
