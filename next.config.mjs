/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "placehold.co",
      },
      {
        protocol: "https",
        hostname: "quickeaseliftparts.com",
      },
      {
        protocol: "https",
        hostname: "*.quickeaseliftparts.com",
      },
    ],
  },

  // ── Secure Headers ─────────────────────────────────────────────────────
  async headers() {
    return [
      // All routes — base security hardening
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          {
            key: "Content-Security-Policy",
            value:
              "default-src 'self'; " +
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
              "style-src 'self' 'unsafe-inline'; " +
              "img-src 'self' https: data:;" +
              "font-src 'self'; " +
              "connect-src 'self' https://quickeaseliftparts.com; " +
              "frame-src 'none'; " +
              "object-src 'none'; " +
              "base-uri 'self'; " +
              "form-action 'self'",
          },
        ],
      },
      // API routes — permissive CORS for cross-origin consumers
      {
        source: "/api/:path*",
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            value: process.env.NEXT_PUBLIC_SITE_URL || "https://quickeaseliftparts.com",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
