import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import fs from "fs";

export const dynamic = 'force-dynamic';

function checkAuth(req: NextRequest): boolean {
  const token = req.cookies.get("admin_token")?.value;
  if (!token) return false;
  try {
    return Buffer.from(token, "base64").toString().startsWith("admin:");
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const sku = (formData.get("sku") as string || "").trim();
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const ext = path.extname(file.name) || ".jpg";

    if (sku) {
      // 有 SKU → 存到 SKU 文件夹
      const skuDir = path.join(process.cwd(), "public", "uploads", sku);
      await mkdir(skuDir, { recursive: true });

      // 找下一个可用序号
      let idx = 1;
      while (fs.existsSync(path.join(skuDir, `${idx}.jpg`))) {
        idx++;
      }
      const fileName = `${idx}.jpg`;
      await writeFile(path.join(skuDir, fileName), buffer);
      return NextResponse.json({ url: `/uploads/${sku}/${fileName}` });
    } else {
      // 无 SKU → 存到扁平目录
      const name = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}${ext}`;
      const uploadDir = path.join(process.cwd(), "public", "uploads");
      await mkdir(uploadDir, { recursive: true });
      await writeFile(path.join(uploadDir, name), buffer);
      return NextResponse.json({ url: `/uploads/${name}` });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
