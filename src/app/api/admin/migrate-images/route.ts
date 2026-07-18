import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST() {
  // Read the updates from the JSON file
  const fs = await import("fs");
  const path = await import("path");
  const updatesPath = path.join(process.cwd(), "scripts", "db_updates.json");

  if (!fs.existsSync(updatesPath)) {
    return NextResponse.json({ error: "db_updates.json not found" }, { status: 404 });
  }

  const updates = JSON.parse(fs.readFileSync(updatesPath, "utf-8"));
  let success = 0;
  let failed: { sku: string; error: string }[] = [];

  for (const item of updates) {
    try {
      await prisma.product.update({
        where: { sku: item.sku },
        data: { images: item.images },
      });
      success++;
    } catch (err: any) {
      failed.push({ sku: item.sku, error: err.message });
    }
  }

  return NextResponse.json({
    ok: true,
    total: updates.length,
    success,
    failed: failed.length,
    errors: failed.slice(0, 10),
  });
}
