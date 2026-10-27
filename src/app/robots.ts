import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://quickeaseliftparts.com";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // /search 是带参数的站内结果页，被抓会产生大量重复内容
        disallow: ["/api/", "/admin/", "/search"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
