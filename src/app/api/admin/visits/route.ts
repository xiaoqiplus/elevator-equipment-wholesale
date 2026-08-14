import { prisma } from "@/lib/prisma";
import { ensureVisitLogTable } from "@/lib/visit-log";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function checkAuth(req: NextRequest): boolean {
  const token = req.cookies.get("admin_token")?.value;
  if (!token) return false;
  try {
    return Buffer.from(token, "base64").toString().startsWith("admin:");
  } catch {
    return false;
  }
}

// GET /api/admin/visits — 访问统计（IP 归属地列表 + 国家分布）
// 参数: page, limit, country=CN, q=IP前缀, range=小时数(0=全部)
export async function GET(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await ensureVisitLogTable();
  } catch {
    return NextResponse.json({ error: "VisitLog table not ready" }, { status: 500 });
  }

  const url = new URL(req.url);
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10) || 1);
  const limit = Math.min(200, Math.max(10, parseInt(url.searchParams.get("limit") || "50", 10) || 50));
  const country = (url.searchParams.get("country") || "").trim();
  const q = (url.searchParams.get("q") || "").trim();
  const rangeHours = parseInt(url.searchParams.get("range") || "0", 10) || 0;

  const where: { country?: string; ip?: { contains: string }; lastSeen?: { gte: Date } } = {};
  if (country) where.country = country;
  if (q) where.ip = { contains: q };
  if (rangeHours > 0) where.lastSeen = { gte: new Date(Date.now() - rangeHours * 3600 * 1000) };

  const [total, rows, agg, countryGroups] = await Promise.all([
    prisma.visitLog.count({ where }),
    prisma.visitLog.findMany({
      where,
      orderBy: { lastSeen: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.visitLog.aggregate({ where, _sum: { visitCount: true } }),
    prisma.visitLog.groupBy({ by: ["country"], where, _sum: { visitCount: true }, _count: true }),
  ]);

  const countries = countryGroups
    .map((g) => ({
      country: g.country,
      visits: g._sum.visitCount ?? 0,
      ips: g._count,
    }))
    .sort((a, b) => b.visits - a.visits);

  return NextResponse.json({
    total,
    totalVisits: agg._sum.visitCount ?? 0,
    page,
    limit,
    pages: Math.max(1, Math.ceil(total / limit)),
    items: rows.map((r) => ({
      ip: r.ip,
      country: r.country,
      path: r.path,
      userAgent: r.userAgent,
      firstSeen: r.firstSeen,
      lastSeen: r.lastSeen,
      visitCount: r.visitCount,
    })),
    countries,
  });
}
