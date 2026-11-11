import { prisma } from "@/lib/prisma";

/**
 * sitemap 数据与序列化（2026-11-11 抽出）
 *
 * 为什么从 `src/app/sitemap.ts` 抽成独立模块 + 路由处理器：
 *   1. Next 的 metadata 路由（sitemap.ts）会被框架强制加上
 *      `Cache-Control: must-revalidate`，和我们要的 `s-maxage` 并存成两个头，
 *      LiteSpeed/hcdn 很可能取后者 → 边缘缓存实际失效。
 *   2. 手写路由处理器可以自己控制 Cache-Control、发 ETag、并对
 *      If-None-Match 回 304 —— 爬虫重复抓取时几乎零传输。
 *
 * 性能背景：全表 3800+ 个 SKU，未缓存时单次生成 2.5–4.3 秒、707 KB。
 * 这里加 10 分钟进程内缓存；且只有查库真的拿到产品才写缓存，
 * 避免一次数据库抖动把「空 sitemap」缓存住 10 分钟。
 */

export interface SitemapEntry {
  url: string;
  lastModified: Date;
  changeFrequency: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority: number;
}

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://quickeaseliftparts.com";
const MEMO_TTL_MS = 10 * 60 * 1000;

let memo: { at: number; data: SitemapEntry[] } | null = null;

/** 仅供测试重置缓存 */
export function __resetSitemapMemo() {
  memo = null;
}

export async function buildSitemapEntries(): Promise<SitemapEntry[]> {
  if (memo && Date.now() - memo.at < MEMO_TTL_MS) return memo.data;

  const now = new Date();

  // 固定页面。⚠️ 只放「真实存在、且 200 直出」的 URL。以下已被移除（2026-11-10）：
  //   /categories —— 2026-06-30 起是 redirect("/products") 跳转壳，提交给 Google 只会报
  //                  「网页会自动重定向」；分类列表就在 /products（view=categories）里。
  //   /quotation、/login、/register —— src/app 下没有对应路由，会被抓成 404。
  const staticPages: SitemapEntry[] = [
    { url: BASE_URL, lastModified: now, changeFrequency: "weekly", priority: 1.0 },
    { url: `${BASE_URL}/products`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE_URL}/brands`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE_URL}/knowledge`, lastModified: now, changeFrequency: "weekly", priority: 0.6 },
    { url: `${BASE_URL}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/contact`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
  ];

  // 产品页
  let productPages: SitemapEntry[] = [];
  try {
    const products = await prisma.product.findMany({
      select: { sku: true, updatedAt: true },
      take: 5000,
    });
    productPages = products
      // 跳过含空白字符的 SKU（2026-11-10 线上实测共 7 个：
      // "Thyssen 3800700010"、"Schindler 50659077"、"ELELATOR DRIVE GBA21310JC1"、
      // "QE-BUTTON-KONE   KM863050G069H092"、"QE-K-KM611085H01 "、"QE-K- KM470560G01"、
      // "QE-O-HAA180DA2 "）。
      // 这类 SKU 的详情页无论怎么编码（%20 / 尾随空格 / NBSP / 全角空格）都 404，
      // 提交进 sitemap 只会让 Google 收到一堆 404，拉低 sitemap 信用。
      // 正解是把这 7 个 SKU 在后台改成 URL 安全写法，改完自动回到本表。
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
  let categoryPages: SitemapEntry[] = [];
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
  let brandPages: SitemapEntry[] = [];
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
  let knowledgePages: SitemapEntry[] = [];
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

  const result = [...staticPages, ...categoryPages, ...brandPages, ...knowledgePages, ...productPages];
  if (productPages.length > 0) memo = { at: Date.now(), data: result };
  return result;
}

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function renderSitemapXml(entries: SitemapEntry[]): string {
  const body = entries
    .map((e) => {
      const lastmod = e.lastModified instanceof Date ? e.lastModified.toISOString() : String(e.lastModified);
      return (
        `  <url>\n` +
        `    <loc>${esc(e.url)}</loc>\n` +
        `    <lastmod>${lastmod}</lastmod>\n` +
        `    <changefreq>${e.changeFrequency}</changefreq>\n` +
        `    <priority>${e.priority.toFixed(1)}</priority>\n` +
        `  </url>`
      );
    })
    .join("\n");

  return (
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    `${body}\n` +
    `</urlset>\n`
  );
}
