/** @type {import('next').NextConfig} */
const nextConfig = {
  // geoip-lite 数据文件（data/*.dat）无法被 webpack 打包，保持外部 require，
  // 运行时从 node_modules 加载（__dirname 正确指向包内 data/ 目录）
  experimental: {
    serverComponentsExternalPackages: ["geoip-lite"],
    // ── Hostinger 共享主机构建容器适配（2026-10-27）──────────────────────
    // 症状：本地 build 正常，Hostinger 上 "compiled successfully" 之后在
    //   "Generating static pages" 阶段 worker 起线程被 OS 拒绝：
    //   Resource temporarily unavailable (os error 11) → SIGABRT
    // 原因：构建容器的线程/进程上限很低，Next 按 CPU 数并行 fork worker 时撞限。
    // 对策：强制单 CPU + 关闭 worker 线程，让静态生成串行跑。
    //   代价：构建慢一些；本地/其它环境无副作用。
    cpus: 1,
    workerThreads: false,
  },

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
            // GA4 需要放行 googletagmanager（脚本）与 google-analytics（数据上报/img beacon）
            value:
              "default-src 'self'; " +
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com; " +
              "style-src 'self' 'unsafe-inline'; " +
              "img-src 'self' https: data:;" +
              "font-src 'self'; " +
              "connect-src 'self' https://quickeaseliftparts.com https://www.google-analytics.com https://*.google-analytics.com https://*.analytics.google.com https://www.googletagmanager.com; " +
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
