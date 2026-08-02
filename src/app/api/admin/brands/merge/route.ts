import { prisma } from "@/lib/prisma";
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

// POST /api/admin/brands/merge — 合并品牌：把 fromId 的产品归到 toId，然后删除 fromId
export async function POST(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const data = await req.json();
    const { fromId, toId } = data;
    if (!fromId || !toId) return NextResponse.json({ error: "缺少 fromId/toId" }, { status: 400 });
    if (fromId === toId) return NextResponse.json({ error: "不能合并到自身" }, { status: 400 });

    const from = await prisma.brand.findUnique({ where: { id: fromId } });
    const to = await prisma.brand.findUnique({ where: { id: toId } });
    if (!from || !to) return NextResponse.json({ error: "品牌不存在" }, { status: 404 });

    const r = await prisma.product.updateMany({
      where: { brandId: fromId },
      data: { brandId: toId },
    });

    await prisma.brand.delete({ where: { id: fromId } });

    return NextResponse.json({
      ok: true,
      moved: r.count,
      from: from.name,
      to: to.name,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
