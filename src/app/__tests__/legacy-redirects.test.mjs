/**
 * 旧 URL 301/308 映射的回归测试（2026-11-18）
 *
 * 背景：GSC 报「未找到（404）129」，有证据的构成是
 *   80 个旧品牌 slug + 20 个旧分类 slug + 4 个旧路由 + 8 个问题 SKU ≈ 114。
 * 这些规则在 next.config.mjs 的 redirects() 里生效，这里锁住关键几条，
 * 防止以后有人手滑删掉或改错目标。
 */
import { describe, it, expect } from "vitest";
import { buildLegacyRedirects } from "../../../legacy-redirects.mjs";

const rules = buildLegacyRedirects();
const bySource = new Map(rules.map((r) => [r.source, r]));

describe("legacy redirects 结构", () => {
  it("规则数量足够覆盖旧 URL（>100 条）", () => {
    expect(rules.length).toBeGreaterThan(100);
  });

  it("没有重复 source（重复会让后面的规则永远不生效）", () => {
    expect(new Set(rules.map((r) => r.source)).size).toBe(rules.length);
  });

  it("全部规则都是 permanent（301/308），没有临时跳转", () => {
    expect(rules.every((r) => r.permanent === true)).toBe(true);
  });

  it("所有 destination 都是站内绝对路径或 apex 绝对 URL", () => {
    for (const r of rules) {
      const ok = r.destination.startsWith("/") || r.destination.startsWith("https://quickeaseliftparts.com");
      expect(ok, `bad destination for ${r.source}: ${r.destination}`).toBe(true);
    }
  });
});

describe("关键规则", () => {
  it("www → apex 必须是第一条（整站副本归一）", () => {
    const first = rules[0];
    expect(first.source).toBe("/:path*");
    expect(first.has).toEqual([{ type: "host", value: "www.quickeaseliftparts.com" }]);
    expect(first.destination).toBe("https://quickeaseliftparts.com/:path*");
  });

  it("/products?view=brands → /brands", () => {
    const rule = rules.find(
      (r) => r.source === "/products" && r.has?.[0]?.key === "view"
    );
    expect(rule).toBeTruthy();
    expect(rule.destination).toBe("/brands");
  });

  it("/categories → /products（单跳，替代原 307 跳转壳）", () => {
    expect(bySource.get("/categories").destination).toBe("/products");
  });

  it("旧品牌 slug → 品牌列表（或最接近的品牌页）", () => {
    expect(bySource.get("/brands/siemens").destination).toBe("/brands");
    expect(bySource.get("/brands/abb").destination).toBe("/brands");
    expect(bySource.get("/brands/thyssenkrupp").destination).toBe("/brands/tke");
    expect(bySource.get("/brands/fujihd").destination).toBe("/brands/fuji");
  });

  it("旧分类 slug → 现存分类", () => {
    expect(bySource.get("/categories/elevator-pcb-kone-elevator-pcb").destination).toBe(
      "/categories/elevator-pcb"
    );
    expect(bySource.get("/categories/kone-elevator-pcb").destination).toBe(
      "/categories/elevator-pcb"
    );
    expect(bySource.get("/categories/lift-equipment").destination).toBe("/products");
    expect(bySource.get("/categories/otis").destination).toBe("/brands/otis");
  });

  it("旧路由不再 404", () => {
    expect(bySource.get("/quotation").destination).toBe("/contact");
    expect(bySource.get("/login").destination).toBe("/contact");
    expect(bySource.get("/register").destination).toBe("/contact");
    expect(bySource.get("/account").destination).toBe("/contact");
    expect(bySource.get("/sitemap").destination).toBe("/sitemap.xml");
    expect(bySource.get("/index.html").destination).toBe("/");
  });

  // ── 2026-11-18 线上事故回归 ─────────────────────────────────────────────
  // Next 的 redirects source 匹配是大小写不敏感的。曾经加了 `/Products → /products`
  // 这类「大写变体归一」，结果小写的 /products 也被匹配，destination 又等于自己
  // → 全站除首页外 308 死循环（线上真实发生，buildId 1q17KIj9…）。
  it("所有 source 必须是全小写（大写 source 会大小写不敏感命中并造成自我跳转）", () => {
    for (const r of rules) {
      expect(r.source, `source must be lowercase: ${r.source}`).toBe(r.source.toLowerCase());
    }
  });

  it("没有任何规则的 destination 与 source 相同（防自我 308 死循环）", () => {
    for (const r of rules) {
      expect(r.destination, `self redirect: ${r.source}`).not.toBe(r.source);
    }
  });

  it("小写静态路由不能被任何规则拦截（/products、/about 等必须直出）", () => {
    const lowerStatics = ["/products", "/brands", "/about", "/knowledge", "/contact", "/search", "/categories"];
    for (const path of lowerStatics) {
      const direct = rules.filter(
        (r) => !r.has && (r.source === path || r.source === `${path}/`)
      );
      // 只有 /categories 是已知的跳转壳（→ /products），其余必须是真实页面
      if (path !== "/categories") {
        expect(direct, `${path} should not be redirected`).toHaveLength(0);
      }
    }
  });
});
