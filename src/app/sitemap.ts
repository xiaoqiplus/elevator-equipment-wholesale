import { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://elevatorequipment.vercel.app";

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

  // Fetch product SKUs from the API for dynamic product pages
  let productPages: MetadataRoute.Sitemap = [];
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000"}/api/products?pageSize=100`,
      { cache: "no-store" }
    );
    if (res.ok) {
      const data = await res.json();
      const products = data.products ?? [];
      productPages = products.map((product: any) => ({
        url: `${BASE_URL}/products/${product.sku}`,
        lastModified: new Date(product.updatedAt ?? Date.now()),
        changeFrequency: "weekly" as const,
        priority: 0.7,
      }));
    }
  } catch {
    // product pages omitted on error
  }

  return [...staticPages, ...productPages];
}
