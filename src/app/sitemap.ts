import { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

// sitemap 始终实时生成（产品新增后立即反映），不缓存
export const revalidate = 0;

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://quickeaseliftparts.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  // 固定页面（含分类/品牌/知识库的列表页 —— 原先漏提交，Google 只能靠自然抓取发现）
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: now, changeFrequency: "weekly", priority: 1.0 },
    { url: `${BASE_URL}/products`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE_URL}/categories`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE_URL}/brands`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE_URL}/knowledge`, lastModified: now, changeFrequency: "weekly", priority: 0.6 },
    { url: `${BASE_URL}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/contact`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/quotation`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
    { url: `${BASE_URL}/login`, lastModified: now, changeFrequency: "monthly", priority: 0.2 },
    { url: `${BASE_URL}/register`, lastModified: now, changeFrequency: "monthly", priority: 0.2 },
  ];

  // 产品页
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
    // 数据库异常时产品页省略，其余页面照常输出
  }

  // 分类页（"elevator door parts" 这类商业词的最佳落地页）
  let categoryPages: MetadataRoute.Sitemap = [];
  try {
    const categories = await prisma.category.findMany({
      select: { slug: true, updatedAt: true },
    });
    categoryPages = categories.map((c) => ({
      url: `${BASE_URL}/categories/${c.slug}`,
      lastModified: c.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));
  } catch {
    /* 忽略 */
  }

  // 品牌页
  let brandPages: MetadataRoute.Sitemap = [];
  try {
    const brands = await prisma.brand.findMany({
      select: { slug: true, updatedAt: true },
    });
    brandPages = brands.map((b) => ({
      url: `${BASE_URL}/brands/${b.slug}`,
      lastModified: b.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    }));
  } catch {
    /* 忽略 */
  }

  // 知识库文章（内容营销的长尾入口）
  let knowledgePages: MetadataRoute.Sitemap = [];
  try {
    const posts = await prisma.knowledge.findMany({
      select: { id: true, createdAt: true },
    });
    knowledgePages = posts.map((p) => ({
      url: `${BASE_URL}/knowledge/${p.id}`,
      lastModified: p.createdAt,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    }));
  } catch {
    /* 忽略 */
  }

  return [...staticPages, ...categoryPages, ...brandPages, ...knowledgePages, ...productPages];
}
