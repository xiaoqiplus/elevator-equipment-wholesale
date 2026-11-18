/**
 * 路径 / canonical 工具函数的回归测试（2026-11-18）
 *
 * 锁住三件在 GSC 报告里真实造成过损失的事：
 *   1. 产品 URL 必须编码（SKU 里有空格、斜杠）；
 *   2. sitemap 只能收录「拼成 URL 还能被路由解析」的 SKU；
 *   3. 分类/品牌分页的 canonical 口径：第 1 页归一、第 N 页自指并保留筛选参数。
 */
import { describe, it, expect } from "vitest";
import { productPath } from "../product-path";
import { isSitemapSafeSku } from "../sitemap-data";
import { catalogCanonical } from "../catalog-url";

describe("productPath：产品 URL 必须编码", () => {
  it("普通 SKU 原样输出", () => {
    expect(productPath("KM964619G24")).toBe("/products/KM964619G24");
  });

  it("含空格的 SKU 被编码（不再产出裸空格 href）", () => {
    expect(productPath("QE-K-KM611085H01 ")).toBe("/products/QE-K-KM611085H01%20");
  });

  it("含斜杠的 SKU 被编码（避免被当成两段路径）", () => {
    expect(productPath("MP310SCE08/09")).toBe("/products/MP310SCE08%2F09");
  });
});

describe("isSitemapSafeSku：含保留字符的 SKU 不进 sitemap", () => {
  it("干净 SKU 通过", () => {
    expect(isSitemapSafeSku("KM964619G24")).toBe(true);
    expect(isSitemapSafeSku("QE-S-59341421")).toBe(true);
  });

  it("空白字符一律拒绝（7 个历史脏 SKU）", () => {
    expect(isSitemapSafeSku("QE-K-KM611085H01 ")).toBe(false);
    expect(isSitemapSafeSku("Thyssen 3800700010")).toBe(false);
    expect(isSitemapSafeSku("QE-K-\u00a0KM470560G01")).toBe(false);
  });

  it("斜杠 / 反斜杠 / ? / # / % 一律拒绝（线上编码后仍 404）", () => {
    expect(isSitemapSafeSku("MP310SCE08/09")).toBe(false);
    expect(isSitemapSafeSku("A\\B")).toBe(false);
    expect(isSitemapSafeSku("A?B")).toBe(false);
    expect(isSitemapSafeSku("A#B")).toBe(false);
    expect(isSitemapSafeSku("A%B")).toBe(false);
  });
});

describe("catalogCanonical：分页 + 筛选的规范化口径", () => {
  it("第 1 页无筛选 → 根 URL", () => {
    expect(catalogCanonical("categories", "elevator-pcb", "brand", "", 1)).toBe(
      "/categories/elevator-pcb"
    );
  });

  it("第 1 页带筛选 → 仍归一到根 URL（导航筛选不单独收录）", () => {
    expect(catalogCanonical("categories", "elevator-pcb", "brand", "kone", 1)).toBe(
      "/categories/elevator-pcb"
    );
  });

  it("第 2 页无筛选 → 自指", () => {
    expect(catalogCanonical("categories", "elevator-pcb", "brand", "", 2)).toBe(
      "/categories/elevator-pcb?page=2"
    );
  });

  it("第 2 页 + 筛选 → 自指且保留筛选参数（修复 canonical 丢页）", () => {
    expect(catalogCanonical("categories", "elevator-pcb", "brand", "kone", 2)).toBe(
      "/categories/elevator-pcb?brand=kone&page=2"
    );
    expect(catalogCanonical("brands", "otis", "category", "elevator-pcb", 3)).toBe(
      "/brands/otis?category=elevator-pcb&page=3"
    );
  });
});
