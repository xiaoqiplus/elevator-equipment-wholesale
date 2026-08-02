import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  // 1. 分类关系
  const cats = await prisma.category.findMany({
    where: { slug: { in: ["escalator-parts", "escalator-parts-other-escalator-parts"] } },
    select: { id: true, name: true, slug: true, parentId: true },
  });

  // 2. 每个分类：产品数 + 按名称排序第一个产品的图片
  const detail: any[] = [];
  for (const c of cats) {
    const total = await prisma.product.count({ where: { categoryId: c.id } });
    const first = await prisma.product.findFirst({
      where: { categoryId: c.id },
      orderBy: { name: "asc" },
      select: { sku: true, name: true, images: true },
    });
    detail.push({
      ...c,
      total,
      firstProduct: first
        ? { sku: first.sku, name: first.name, imgCount: Array.isArray(first.images) ? first.images.length : 0 }
        : null,
    });
  }

  // 3. 有图产品统计
  const catAll = await prisma.category.findMany({
    where: { slug: { in: ["escalator-parts", "escalator-parts-other-escalator-parts"] } },
    select: { id: true, name: true, slug: true },
  });
  const withImg: any[] = [];
  for (const c of catAll) {
    const products = await prisma.product.findMany({
      where: { categoryId: c.id },
      select: { images: true },
    });
    const hasImg = products.filter((p) => Array.isArray(p.images) && p.images.length > 0).length;
    withImg.push({ slug: c.slug, total: products.length, withImg: hasImg, noImg: products.length - hasImg });
  }

  return NextResponse.json({ cats: detail, imgStats: withImg });
}
