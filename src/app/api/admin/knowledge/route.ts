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

// GET /api/admin/knowledge — 文章列表（分页+搜索）
export async function GET(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const q = url.searchParams.get("q") || "";
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1"));
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") || "50")));
  const skip = (page - 1) * limit;

  const where = q ? { OR: [{ title: { contains: q } }, { summary: { contains: q } }] } : {};

  const [articles, total] = await Promise.all([
    prisma.knowledge.findMany({
      where,
      select: { id: true, title: true, url: true, date: true, images: true, summary: true },
      orderBy: { date: "desc" },
      skip,
      take: limit,
    }),
    prisma.knowledge.count({ where }),
  ]);

  return NextResponse.json({ articles, total, page, totalPages: Math.ceil(total / limit) });
}

// POST /api/admin/knowledge — 新增文章
export async function POST(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const data = await req.json();
    const { title, url, summary, content, images } = data;
    if (!title) return NextResponse.json({ error: "标题不能为空" }, { status: 400 });

    const article = await prisma.knowledge.create({
      data: {
        title,
        url: url || "",
        summary: summary || null,
        content: content || null,
        images: images || null,
        date: new Date(),
      },
    });
    return NextResponse.json({ ok: true, id: article.id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PUT /api/admin/knowledge — 更新文章
export async function PUT(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const data = await req.json();
    const { id, title, url, summary, content, images } = data;
    if (!id || !title) return NextResponse.json({ error: "ID和标题不能为空" }, { status: 400 });

    await prisma.knowledge.update({
      where: { id },
      data: { title, url: url || "", summary, content, images },
    });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE /api/admin/knowledge?id=xxx — 删除文章
export async function DELETE(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const id = req.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "缺少 ID" }, { status: 400 });

    await prisma.knowledge.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
