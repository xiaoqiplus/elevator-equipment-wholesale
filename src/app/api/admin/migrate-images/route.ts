import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

export async function POST() {
  const uploadsDir = path.join(process.cwd(), "public", "uploads");

  if (!fs.existsSync(uploadsDir)) {
    return NextResponse.json({ error: "uploads directory not found" }, { status: 404 });
  }

  // Scan all SKU folders in public/uploads/
  const skuFolders = fs.readdirSync(uploadsDir, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name);

  let success = 0;
  let skipped = 0;
  let failed: { sku: string; error: string }[] = [];

  for (const sku of skuFolders) {
    const skuDir = path.join(uploadsDir, sku);
    const jpgFiles = fs.readdirSync(skuDir)
      .filter((f) => f.endsWith(".jpg"))
      .sort((a, b) => {
        // Sort by numeric filename: 1.jpg, 2.jpg, etc.
        const numA = parseInt(a.replace(".jpg", ""), 10);
        const numB = parseInt(b.replace(".jpg", ""), 10);
        return numA - numB;
      })
      .map((f) => `/uploads/${sku}/${f}`);

    if (jpgFiles.length === 0) {
      skipped++;
      continue;
    }

    try {
      await prisma.product.update({
        where: { sku },
        data: { images: jpgFiles },
      });
      success++;
    } catch (err: any) {
      // Product not found by SKU — not necessarily an error
      if (err.code === "P2025") {
        skipped++;
      } else {
        failed.push({ sku, error: err.message });
      }
    }
  }

  return NextResponse.json({
    ok: true,
    totalFolders: skuFolders.length,
    success,
    skipped,
    failed: failed.length,
    errors: failed.slice(0, 10),
  });
}
