import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

// 自动建表（幂等）
async function ensureTable() {
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS SiteConfig (
        id        VARCHAR(36) PRIMARY KEY,
        \`key\`     VARCHAR(128) NOT NULL UNIQUE,
        value     JSON NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
  } catch {
    // 表已存在则静默跳过
  }
}

function checkAuth(req: NextRequest): boolean {
  const token = req.cookies.get("admin_token")?.value;
  if (!token) return false;
  try {
    return Buffer.from(token, "base64").toString().startsWith("admin:");
  } catch {
    return false;
  }
}

// GET /api/admin/site-config — 获取所有配置（公开，供前端展示）
export async function GET() {
  await ensureTable();
  try {
    const rows = await prisma.$queryRawUnsafe<
      Array<{ key: string; value: any }>
    >("SELECT `key`, value FROM SiteConfig");

    const config: Record<string, any> = {};
    for (const row of rows) {
      config[row.key] = row.value;
    }
    return NextResponse.json({ ok: true, config });
  } catch {
    return NextResponse.json({ ok: true, config: {} });
  }
}

// PUT /api/admin/site-config — 批量更新配置（需登录）
export async function PUT(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await ensureTable();

  try {
    const data = await req.json();
    for (const [key, value] of Object.entries(data)) {
      const id =
        key === "contact_email"
          ? "cfg_contact"
          : `cfg_${key.replace(/[^a-z0-9_]/g, "_")}`;
      await prisma.$executeRawUnsafe(
        `INSERT INTO SiteConfig (id, \`key\`, value)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE value = VALUES(value), updatedAt = CURRENT_TIMESTAMP`,
        id,
        key,
        JSON.stringify(value),
      );
    }
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
