import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function checkAuth(req: Request): Promise<boolean> {
  const token = req.headers.get("cookie")?.match(/admin_token=([^;]+)/)?.[1];
  if (!token) return false;
  try {
    const decoded = Buffer.from(decodeURIComponent(token), "base64").toString();
    return decoded.startsWith("admin:");
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  if (!await checkAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { updates } = await req.json();
    if (!Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json({ error: "updates array required" }, { status: 400 });
    }

    // Fetch all categories and brands for name matching
    const allCategories = await prisma.category.findMany();
    const allBrands = await prisma.brand.findMany();

    let updated = 0;
    let skipped = 0;
    let errors: { sku: string; error: string }[] = [];

    for (const item of updates) {
      try {
        const product = await prisma.product.findUnique({ where: { sku: item.sku } });
        if (!product) { skipped++; continue; }

        // Match category by name
        let categoryId = product.categoryId;
        if (item.category?.name) {
          const cat = allCategories.find(
            (c) => c.name.toLowerCase() === item.category.name.toLowerCase()
          );
          if (cat) categoryId = cat.id;
        }

        // Match brand by name
        let brandId = product.brandId;
        if (item.brand?.name) {
          const brand = allBrands.find(
            (b) => b.name.toLowerCase() === item.brand.name.toLowerCase()
          );
          if (brand) brandId = brand.id;
        }

        // Skip if nothing changed
        if (categoryId === product.categoryId && brandId === product.brandId) {
          skipped++;
          continue;
        }

        await prisma.product.update({
          where: { sku: item.sku },
          data: { categoryId, brandId },
        });
        updated++;
      } catch (err: any) {
        errors.push({ sku: item.sku, error: err.message });
      }
    }

    return NextResponse.json({
      ok: true,
      total: updates.length,
      updated,
      skipped,
      failed: errors.length,
      errors: errors.slice(0, 10),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
