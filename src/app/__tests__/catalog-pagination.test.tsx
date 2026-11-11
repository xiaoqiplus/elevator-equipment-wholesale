/**
 * 分类页 / 品牌页分页回归测试（2026-11-11）
 *
 * 背景：这两个页面原先一次把分类/品牌下的产品全查出来渲染，最大的分类有 646 个产品，
 * 单页 HTML + RSC 载荷极大，在共享主机上每访问一次都是一次重活。
 * 改成每页 48 条 + count 分页后，用这组测试锁住：
 *   1. 第一页只取 48 条（skip=0，take=48）；
 *   2. 第二页 skip=48；
 *   3. 分页导航渲染出来，且链接保留 brand / category 过滤参数；
 *   4. 顶部数量徽标显示的是「总数」而不是「本页条数」。
 */
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

const PAGE_SIZE = 48;

function fakeProducts(n: number) {
  return Array.from({ length: n }, (_, i) => ({
    sku: `SKU-${i + 1}`,
    name: `Product ${i + 1}`,
    description: null,
    images: [],
    category: null,
    brand: null,
  }));
}

vi.mock("@/lib/prisma", () => ({
  prisma: {
    category: {
      findUnique: vi.fn(async ({ where }: any) =>
        where.slug === "elevator-pcb"
          ? { id: "c1", name: "Elevator Pcb", slug: "elevator-pcb" }
          : null
      ),
      findMany: vi.fn(async () => [
        { id: "c1", name: "Elevator Pcb", slug: "elevator-pcb" },
      ]),
    },
    brand: {
      findUnique: vi.fn(async ({ where }: any) =>
        where.slug === "otis" ? { id: "b1", name: "Otis", slug: "otis" } : null
      ),
      findMany: vi.fn(async () => []),
    },
    product: {
      groupBy: vi.fn(async () => []),
      count: vi.fn(async () => 646),
      findMany: vi.fn(async () => fakeProducts(PAGE_SIZE)),
    },
  },
}));

vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));

import { prisma } from "@/lib/prisma";
import CategoryDetailPage from "../categories/[slug]/page";
import BrandDetailPage from "../brands/[slug]/page";

const count = prisma.product.count as unknown as ReturnType<typeof vi.fn>;
const findMany = prisma.product.findMany as unknown as ReturnType<typeof vi.fn>;

beforeEach(() => {
  count.mockClear();
  findMany.mockClear();
});

describe("分类页分页", () => {
  it("第 1 页只取 48 条（skip=0, take=48），徽标显示总数", async () => {
    const el = await CategoryDetailPage({
      params: { slug: "elevator-pcb" },
      searchParams: {},
    });
    render(el as React.ReactElement);

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: PAGE_SIZE, skip: 0 })
    );
    // 646 是总数，不是本页的 48 条
    expect(screen.getByText("646 items")).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Pagination" })).toBeInTheDocument();
  });

  it("第 2 页 skip=48", async () => {
    const el = await CategoryDetailPage({
      params: { slug: "elevator-pcb" },
      searchParams: { page: "2" },
    });
    render(el as React.ReactElement);

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: PAGE_SIZE, skip: PAGE_SIZE })
    );
  });

  it("分页链接保留 brand 过滤参数", async () => {
    const el = await CategoryDetailPage({
      params: { slug: "elevator-pcb" },
      searchParams: { brand: "otis" },
    });
    render(el as React.ReactElement);

    const next = screen.getByText("Next ›").closest("a");
    expect(next?.getAttribute("href")).toBe("/categories/elevator-pcb?brand=otis&page=2");
  });

  it("产品数不超过 48 时不渲染分页导航", async () => {
    count.mockResolvedValueOnce(48);
    const el = await CategoryDetailPage({
      params: { slug: "elevator-pcb" },
      searchParams: {},
    });
    render(el as React.ReactElement);
    expect(screen.queryByRole("navigation", { name: "Pagination" })).toBeNull();
  });
});

describe("品牌页分页", () => {
  it("第 1 页 take=48、skip=0", async () => {
    const el = await BrandDetailPage({
      params: { slug: "otis" },
      searchParams: {},
    });
    render(el as React.ReactElement);

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: PAGE_SIZE, skip: 0 })
    );
    expect(screen.getByText("646 items")).toBeInTheDocument();
  });

  it("分页链接保留 category 过滤参数", async () => {
    const el = await BrandDetailPage({
      params: { slug: "otis" },
      searchParams: { category: "elevator-pcb" },
    });
    render(el as React.ReactElement);

    const next = screen.getByText("Next ›").closest("a");
    expect(next?.getAttribute("href")).toBe("/brands/otis?category=elevator-pcb&page=2");
  });
});
