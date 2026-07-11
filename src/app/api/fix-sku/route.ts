import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET() {
  const prisma = new PrismaClient();
  try {
    const products = await prisma.product.findMany({ select: { id: true, sku: true, name: true } });
    let updated = 0;
    let errors: string[] = [];

    for (const p of products) {
      const newSku = p.sku.replace(/^GENT-/i, "");
      if (newSku !== p.sku) {
        // 检查新 SKU 是否已存在
        const dup = await prisma.product.findUnique({ where: { sku: newSku } });
        if (dup) {
          errors.push(`${p.sku} → ${newSku} (冲突)`);
          continue;
        }
        await prisma.product.update({
          where: { id: p.id },
          data: { sku: newSku },
        });
        updated++;
      }
    }

    return NextResponse.json({
      ok: true,
      total: products.length,
      updated,
      errors: errors.length > 0 ? errors.slice(0, 10) : [],
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
