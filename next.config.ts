import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return {
      // Marketing pages share their own styles and assets in public/landing.
      beforeFiles: [
        { source: "/", destination: "/landing/index.html" },
        { source: "/about", destination: "/landing/about.html" },
      ],
      afterFiles: [],
      fallback: [],
    };
  },
};

export default nextConfig;
