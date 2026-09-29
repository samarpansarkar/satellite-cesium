import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['192.168.3.183'],
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
