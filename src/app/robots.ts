import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://quickeaseliftparts.com";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // /search 不再 disallow：它已在页面里声明 robots: noindex。
        // 如果这里继续 disallow，Googlebot 抓不到页面就看不到 noindex，
        // 已收录的搜索页会一直赖在索引里删不掉。noindex + 可抓取 才是正确组合。
        disallow: ["/api/", "/admin/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
