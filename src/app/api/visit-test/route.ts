import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// 临时诊断路由：定位访问统计 500 根因，定位后删除
export const dynamic = "force-dynamic";

export async function GET() {
  const out: Record<string, unknown> = {};

  // 1. geoip-lite 是否可用（延迟 require，避免模块副作用）
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const geoip = require("geoip-lite");
    out.geoipLookup = (geoip.lookup("8.8.8.8") as { country?: string } | null)?.country ?? null;
  } catch (e) {
    out.geoipError = e instanceof Error ? e.message : String(e);
  }

  // 2. VisitLog 表是否存在
  try {
    const rows = await prisma.$queryRawUnsafe("SHOW TABLES LIKE 'VisitLog'");
    out.visitLogTable = rows;
  } catch (e) {
    out.visitLogTableError = e instanceof Error ? e.message : String(e);
  }

  // 3. Prisma VisitLog 模型查询
  try {
    out.visitLogCount = await prisma.visitLog.count();
  } catch (e) {
    out.visitLogCountError = e instanceof Error ? e.message : String(e);
  }

  return NextResponse.json(out);
}
