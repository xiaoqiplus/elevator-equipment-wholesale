import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import fs from "fs";
import sharp from "sharp";

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

const WATERMARK_PATH = path.join(process.cwd(), "public", "logo-watermark.png");

async function addWatermark(buffer: Buffer): Promise<Buffer> {
  try {
    if (!fs.existsSync(WATERMARK_PATH)) {
      console.warn("水印文件不存在:", WATERMARK_PATH);
      return buffer;
    }

    const img = sharp(buffer);
    const metadata = await img.metadata();
    const w = metadata.width || 800;
    const h = metadata.height || 600;

    const watermarkWidth = Math.min(Math.round(w * 0.10), 150);

    const result = await img
      .composite([
        {
          input: await sharp(WATERMARK_PATH)
            .resize(watermarkWidth, null, { fit: "inside", withoutEnlargement: true })
            .toBuffer(),
          gravity: "southeast",
          blend: "over",
        },
      ])
      .toBuffer();

    return Buffer.from(result);
  } catch (err) {
    console.warn("水印添加失败:", err);
    return buffer;
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
    const ext = path.extname(file.name) || ".jpg";

    // 添加水印
    const watermarked = await addWatermark(Buffer.from(bytes));
    const outBuffer = Buffer.from(watermarked);

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
      await writeFile(path.join(skuDir, fileName), outBuffer);
      return NextResponse.json({ url: `/uploads/${sku}/${fileName}` });
    } else {
      // 无 SKU → 存到扁平目录
      const name = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}${ext}`;
      const uploadDir = path.join(process.cwd(), "public", "uploads");
      await mkdir(uploadDir, { recursive: true });
      await writeFile(path.join(uploadDir, name), outBuffer);
      return NextResponse.json({ url: `/uploads/${name}` });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
