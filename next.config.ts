import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow /widget to be embedded as an iframe on WordPress (or any domain)
  async headers() {
    return [
      {
        // Apply to the widget page and the chat API
        source: "/(widget|api/chat)(.*)",
        headers: [
          // Override Next.js default SAMEORIGIN to allow any site to embed
          {
            key: "X-Frame-Options",
            value: "ALLOWALL",
          },
          // Modern iframe embedding permission
          {
            key: "Content-Security-Policy",
            value: "frame-ancestors *",
          },
          // Allow CORS so WordPress JS can also call the API directly
          {
            key: "Access-Control-Allow-Origin",
            value: "*",
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET, POST, OPTIONS",
          },
          {
            key: "Access-Control-Allow-Headers",
            value: "Content-Type, Authorization",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
