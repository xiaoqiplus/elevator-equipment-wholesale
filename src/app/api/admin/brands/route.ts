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

// GET /api/admin/brands — 品牌列表（含产品数）
export async function GET(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const q = url.searchParams.get("q") || "";

  const brands = await prisma.brand.findMany({
    where: q ? { name: { contains: q } } : {},
    include: { _count: { select: { products: true } } },
    orderBy: [{ products: { _count: "desc" } }, { name: "asc" }],
  });

  return NextResponse.json({
    brands: brands.map((b) => ({
      id: b.id,
      name: b.name,
      slug: b.slug,
      logoUrl: b.logoUrl,
      count: b._count.products,
    })),
  });
}

// POST /api/admin/brands — 新增品牌
export async function POST(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const data = await req.json();
    const { name, slug } = data;
    if (!name) return NextResponse.json({ error: "品牌名称不能为空" }, { status: 400 });

    const finalSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

    const dup = await prisma.brand.findUnique({ where: { slug: finalSlug } });
    if (dup) return NextResponse.json({ error: `slug "${finalSlug}" 已存在` }, { status: 400 });

    const brand = await prisma.brand.create({ data: { name, slug: finalSlug } });
    return NextResponse.json({ ok: true, brand });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PUT /api/admin/brands — 编辑品牌（改名/改slug）
export async function PUT(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const data = await req.json();
    const { id, name, slug } = data;
    if (!id || !name) return NextResponse.json({ error: "ID和名称不能为空" }, { status: 400 });

    const brand = await prisma.brand.findUnique({ where: { id } });
    if (!brand) return NextResponse.json({ error: "品牌不存在" }, { status: 404 });

    let finalSlug = brand.slug;
    if (slug && slug !== brand.slug) {
      finalSlug = slug.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      const dup = await prisma.brand.findUnique({ where: { slug: finalSlug } });
      if (dup && dup.id !== id) return NextResponse.json({ error: `slug "${finalSlug}" 已被占用` }, { status: 400 });
    }

    const updated = await prisma.brand.update({
      where: { id },
      data: { name, slug: finalSlug },
    });
    return NextResponse.json({ ok: true, brand: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE /api/admin/brands?id=xxx — 删除品牌（仅产品数为0时）
export async function DELETE(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const id = req.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "缺少 ID" }, { status: 400 });

    const brand = await prisma.brand.findUnique({
      where: { id },
      include: { _count: { select: { products: true } } },
    });
    if (!brand) return NextResponse.json({ error: "品牌不存在" }, { status: 404 });
    if (brand._count.products > 0) {
      return NextResponse.json({ error: `品牌下还有 ${brand._count.products} 个产品，不能删除` }, { status: 400 });
    }

    await prisma.brand.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
