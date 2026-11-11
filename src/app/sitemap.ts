import { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

// ⚠️ 性能：sitemap 覆盖 3800+ 个 SKU，未缓存时单次要查 3800 行、耗时 2.5–4.3 秒、输出 707 KB
// （2026-11-11 实测）。爬虫、监控、站长工具多抓几次，就会把共享主机压到资源上限。
// 这些 URL 10 分钟内基本不会变，所以这里做进程内缓存 + 边缘缓存（next.config.mjs 里的
// Cache-Control: s-maxage），而不是 `revalidate = 0` 那样每抓一次打一次数据库。
// 保留 dynamic（不在构建期查库），只是同一进程内 10 分钟内复用结果。
export const dynamic = "force-dynamic";

const MEMO_TTL_MS = 10 * 60 * 1000;
let memo: { at: number; data: MetadataRoute.Sitemap } | null = null;

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://quickeaseliftparts.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (memo && Date.now() - memo.at < MEMO_TTL_MS) return memo.data;

  const now = new Date();

  // 固定页面（含分类/品牌/知识库的列表页 —— 原先漏提交，Google 只能靠自然抓取发现）
  // ⚠️ 只放「真实存在、且 200 直出」的 URL。以下四类已被移除（2026-11-10）：
  //   /categories —— 2026-06-30 起是 redirect("/products") 跳转壳，提交给 Google 只会报
  //                  「网页会自动重定向」；分类列表就在 /products（view=categories）里。
  //   /quotation、/login、/register —— src/app 下没有对应路由，会被抓成 404。
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: now, changeFrequency: "weekly", priority: 1.0 },
    { url: `${BASE_URL}/products`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE_URL}/brands`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE_URL}/knowledge`, lastModified: now, changeFrequency: "weekly", priority: 0.6 },
    { url: `${BASE_URL}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/contact`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
  ];

  // 产品页
  let productPages: MetadataRoute.Sitemap = [];
  try {
    const products = await prisma.product.findMany({
      select: { sku: true, updatedAt: true },
      take: 5000,
    });
    productPages = products
      // 跳过含空白字符的 SKU（2026-11-10 线上实测：共 7 个，涉及
      // "Thyssen 3800700010"、"Schindler 50659077"、"ELELATOR DRIVE GBA21310JC1"、
      // "QE-BUTTON-KONE   KM863050G069H092"、"QE-K-KM611085H01 "、"QE-K- KM470560G01"、
      // "QE-O-HAA180DA2 "）。
      // 这类 SKU 的详情页无论怎么编码（%20 / 尾随空格 / NBSP / 全角空格）都返回 404，
      // 即产品页原本就不可达 —— 提交进 sitemap 只会让 Google 收到一堆 404，拉低 sitemap 信用。
      // 正解是把这 7 个 SKU 在后台改成 URL 安全写法（见 STATE.md 待办），改完自动回到本表。
      .filter((product) => !/\s/.test(product.sku))
      .map((product) => ({
        // 其余 SKU 仍做编码兜底（竞品导入的数据可能含保留字符）
        url: `${BASE_URL}/products/${encodeURIComponent(product.sku)}`,
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

  // 只有查库真的成功（拿到产品）才写缓存，避免一次数据库抖动把空 sitemap 缓存 10 分钟
  const result = [...staticPages, ...categoryPages, ...brandPages, ...knowledgePages, ...productPages];
  if (productPages.length > 0) memo = { at: Date.now(), data: result };
  return result;
}
