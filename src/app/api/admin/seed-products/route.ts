import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    // Simple auth check - same as admin products API
    const token = req.headers.get("cookie")?.match(/admin_token=([^;]+)/)?.[1];
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    try {
      const decoded = Buffer.from(token, "base64").toString();
      if (!decoded.startsWith("admin:")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    } catch {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { products } = await req.json();
    if (!Array.isArray(products) || products.length === 0) {
      return NextResponse.json({ error: "products array required" }, { status: 400 });
    }

    // Fetch all categories and brands for name-based matching
    const allCategories = await prisma.category.findMany();
    const allBrands = await prisma.brand.findMany();

    let imported = 0;
    let skipped = 0;
    let errors: { sku: string; error: string }[] = [];

    for (const p of products) {
      try {
        // Check if product already exists
        const existing = await prisma.product.findUnique({ where: { sku: p.sku } });
        if (existing) {
          skipped++;
          continue;
        }

        // Match category by name
        let categoryId = null;
        if (p.category?.name) {
          const cat = allCategories.find(
            (c) => c.name.toLowerCase() === p.category.name.toLowerCase()
          );
          if (cat) categoryId = cat.id;
        }

        // Match brand by name
        let brandId = null;
        if (p.brand?.name) {
          const brand = allBrands.find(
            (b) => b.name.toLowerCase() === p.brand.name.toLowerCase()
          );
          if (brand) brandId = brand.id;
        }

        // Convert old flat paths to new SKU folder paths
        const oldImages: string[] = p.images || [];
        const newImages = oldImages.map((_img: string, i: number) =>
          `/uploads/${p.sku}/${i + 1}.jpg`
        );

        await prisma.product.create({
          data: {
            sku: p.sku,
            name: p.name,
            categoryId,
            brandId,
            images: newImages.length > 0 ? newImages : [],
          },
        });
        imported++;
      } catch (err: any) {
        errors.push({ sku: p.sku, error: err.message });
      }
    }

    return NextResponse.json({
      ok: true,
      total: products.length,
      imported,
      skipped,
      failed: errors.length,
      errors: errors.slice(0, 10),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
