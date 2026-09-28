import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://192.168.1.4:8080/:path*", // API Proxy
      },
    ];
  },
};

export default nextConfig;
