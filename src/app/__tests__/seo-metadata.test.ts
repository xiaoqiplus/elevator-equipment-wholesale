/**
 * SEO 回归测试（2026-11-10）
 *
 * 背景：2026-10-27 的提交在根布局加了 `alternates: { canonical: "/" }`，
 * Next 的 metadata 向下继承，导致除产品详情页外的所有页面都在输出
 * `canonical = 首页`，Google Search Console 把整批页面报成
 * 「备用网页（有适当的规范标记）」并剔出索引。
 *
 * 这些用例锁住四件事：
 *   1. 根布局绝不能再声明 absolute canonical（否则全站又开始给首页投票）；
 *   2. 每个公开路由必须自指 canonical；
 *   3. 带筛选参数的分类/品牌页归一到无参数 URL；
 *   4. sitemap 只允许「真实存在且 200 直出」的 URL（不能有跳转壳和 404）。
 */
import { describe, it, expect, vi } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

// ── 假数据库：只为 generateMetadata 提供最小可用数据 ──────────────────────
vi.mock("@/lib/prisma", () => ({
  prisma: {
    category: {
      findUnique: vi.fn(async ({ where }: any) =>
        where.slug === "elevator-door-parts"
          ? { id: "c1", name: "Elevator Door Parts", slug: "elevator-door-parts" }
          : null
      ),
      findMany: vi.fn(async () => [
        { slug: "elevator-door-parts", updatedAt: new Date("2026-11-01T00:00:00Z") },
      ]),
    },
    brand: {
      findUnique: vi.fn(async ({ where }: any) =>
        where.slug === "otis" ? { id: "b1", name: "Otis", slug: "otis" } : null
      ),
      findMany: vi.fn(async () => [
        { slug: "otis", updatedAt: new Date("2026-11-01T00:00:00Z") },
      ]),
    },
    knowledge: {
      findUnique: vi.fn(async ({ where }: any) =>
        where.id === "k1"
          ? {
              id: "k1",
              title: "Escalator Handrail Replacement Guide",
              summary: "<p>How to replace an escalator handrail step by step.</p>",
              content: null,
            }
          : null
      ),
      findMany: vi.fn(async () => [
        { id: "k1", createdAt: new Date("2026-11-01T00:00:00Z") },
      ]),
    },
    product: {
      count: vi.fn(async () => 276),
      findMany: vi.fn(async () => [
        // 故意带一个含空格的 SKU：验证 sitemap 会把它编码
        { sku: "QE-K-KM611085H01 ", updatedAt: new Date("2026-11-01T00:00:00Z") },
        { sku: "KM964619G24", updatedAt: new Date("2026-11-01T00:00:00Z") },
      ]),
    },
  },
}));

const HOME = "https://quickeaseliftparts.com";

describe("布局：canonical 不能再从根布局泄漏", () => {
  it("layout.tsx 的 metadata 里不应出现 alternates.canonical", () => {
    const raw = readFileSync(resolve(__dirname, "../layout.tsx"), "utf8");
    // 先去整行注释：注释里会举例提到 `canonical: "/"`，那不是生效代码
    const src = raw
      .split("\n")
      .filter((line) => !/^\s*\/\//.test(line))
      .join("\n");
    expect(src).not.toMatch(/alternates\s*:\s*\{\s*canonical/);
    expect(src).not.toMatch(/canonical\s*:\s*["']\/["']/);
  });
});

describe("各路由必须自指 canonical", () => {
  it("首页显式自指 /（声明在 page.tsx，不在 layout）", async () => {
    const { metadata } = await import("../page");
    expect(metadata.alternates?.canonical).toBe("/");
  });

  it("/products 自指，且忽略 ?view= / ?q=", async () => {
    const { metadata } = await import("../products/page");
    expect(metadata.alternates?.canonical).toBe("/products");
  });

  it("/categories/[slug] 自指，且忽略 ?brand= 过滤参数", async () => {
    const { generateMetadata } = await import("../categories/[slug]/page");
    const m: any = await generateMetadata({ params: { slug: "elevator-door-parts" } });
    expect(m.alternates.canonical).toBe("/categories/elevator-door-parts");
    expect(m.title).toContain("Elevator Door Parts");
    expect(m.description).toContain("276");
  });

  it("/brands/[slug] 自指，且忽略 ?category= 过滤参数", async () => {
    const { generateMetadata } = await import("../brands/[slug]/page");
    const m: any = await generateMetadata({ params: { slug: "otis" } });
    expect(m.alternates.canonical).toBe("/brands/otis");
    expect(m.title).toContain("Otis");
  });

  it("/knowledge/[id] 自指，且描述去掉了 HTML 标签", async () => {
    const { generateMetadata } = await import("../knowledge/[id]/page");
    const m: any = await generateMetadata({ params: { id: "k1" } });
    expect(m.alternates.canonical).toBe("/knowledge/k1");
    expect(m.description).not.toContain("<p>");
  });

  it("/knowledge、/about、/contact、/brands 都有自指 canonical", async () => {
    const k = await import("../knowledge/page");
    const a = await import("../about/page");
    const c = await import("../contact/layout");
    const b = await import("../brands/page");
    expect(k.metadata.alternates?.canonical).toBe("/knowledge");
    expect(a.metadata.alternates?.canonical).toBe("/about");
    expect(c.metadata.alternates?.canonical).toBe("/contact");
    expect(b.metadata.alternates?.canonical).toBe("/brands");
  });

  it("/search 必须 noindex（站内搜索结果不进索引）", async () => {
    const { metadata } = await import("../search/page");
    expect(metadata.robots).toMatchObject({ index: false });
  });
});

describe("sitemap 只能提交真实存在的 URL", () => {
  it("不含跳转壳 /categories 与 404 路由", async () => {
    const sitemap = (await import("../sitemap")).default;
    const urls = (await sitemap()).map((e: any) => e.url);
    for (const bad of ["/categories", "/quotation", "/login", "/register"]) {
      expect(urls).not.toContain(`${HOME}${bad}`);
    }
    // 分类详情页仍然要在
    expect(urls).toContain(`${HOME}/categories/elevator-door-parts`);
  });

  it("产品 URL 做了编码（SKU 含空格也不会产生非法 URL）", async () => {
    const sitemap = (await import("../sitemap")).default;
    const urls = (await sitemap()).map((e: any) => e.url);
    const spaced = urls.find((u: string) => u.includes("QE-K-KM611085H01"));
    expect(spaced).toBe(`${HOME}/products/QE-K-KM611085H01%20`);
    expect(urls.every((u: string) => !u.includes(" "))).toBe(true);
  });
});
