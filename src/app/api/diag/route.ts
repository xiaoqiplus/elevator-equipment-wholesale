import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const brands = await prisma.brand.findMany({
    include: { _count: { select: { products: true } } },
    orderBy: { products: { _count: "desc" } },
  });

  const categories = await prisma.category.findMany({
    include: { _count: { select: { products: true } } },
    orderBy: { products: { _count: "desc" } },
  });

  return NextResponse.json({
    brands: brands.map((b) => ({
      id: b.id,
      name: b.name,
      slug: b.slug,
      count: b._count.products,
    })),
    categories: categories.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      count: c._count.products,
    })),
  });
}
