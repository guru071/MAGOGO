import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
  allowedDevOrigins: [
    "preview-chat-be1e7206-b5c6-4688-a3c4-0f25f20b014d.space-z.ai",
    "localhost",
    "127.0.0.1",
  ],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      { protocol: 'http', hostname: '**' }
    ]
  }
};

export default nextConfig;