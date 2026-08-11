import { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

// sitemap 始终实时生成（产品新增后立即反映），不缓存
export const revalidate = 0;

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://quickeaseliftparts.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/products`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/quotation`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/login`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.2,
    },
    {
      url: `${BASE_URL}/register`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.2,
    },
  ];

  // Fetch product SKUs from the database directly
  let productPages: MetadataRoute.Sitemap = [];
  try {
    const products = await prisma.product.findMany({
      select: { sku: true, updatedAt: true },
      take: 5000,
    });
    productPages = products.map((product) => ({
      url: `${BASE_URL}/products/${product.sku}`,
      lastModified: product.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));
  } catch {
    // product pages omitted on error
  }

  return [...staticPages, ...productPages];
}
