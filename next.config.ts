import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['10.255.255.254', '192.168.1.11'],
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
