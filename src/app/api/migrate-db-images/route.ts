import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET() {
  const results: any = { total: 0, updated: 0, skipped: 0, errors: [] };

  try {
    const products = await prisma.product.findMany({
      select: { id: true, sku: true, images: true },
    });

    results.total = products.length;

    for (const p of products) {
      const oldImages = p.images as string[];
      if (!Array.isArray(oldImages) || oldImages.length === 0) {
        results.skipped++;
        continue;
      }

      // 生成新的 SKU 文件夹路径
      const newImages = oldImages.map((_, idx) => `/uploads/${p.sku}/${idx + 1}.jpg`);

      await prisma.product.update({
        where: { id: p.id },
        data: { images: newImages },
      });

      results.updated++;
    }
  } catch (err: any) {
    results.errors.push(err.message?.substring(0, 500));
  }

  return NextResponse.json(results);
}
