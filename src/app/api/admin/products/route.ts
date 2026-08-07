import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import path from "path";

export const dynamic = 'force-dynamic';

// 验证管理员身份（简单cookie检查）
function checkAuth(req: NextRequest): boolean {
  const token = req.cookies.get("admin_token")?.value;
  if (!token) return false;
  try {
    const decoded = Buffer.from(token, "base64").toString();
    return decoded.startsWith("admin:");
  } catch {
    return false;
  }
}

// GET /api/admin/products — 产品列表（支持搜索、分页）
export async function GET(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const q = url.searchParams.get("q") || "";
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1"));
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") || "50")));
  const skip = (page - 1) * limit;

  const where = q
    ? {
        OR: [
          { name: { contains: q } },
          { sku: { contains: q } },
        ],
      }
    : {};

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      select: {
        sku: true,
        name: true,
        description: true,
        images: true,
        specs: true,
        warranty: true,
        leadTime: true,
        payment: true,
        isHot: true,
        category: { select: { name: true } },
        brand: { select: { name: true } },
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.product.count({ where }),
  ]);

  return NextResponse.json({
    products: products.map((p) => ({
      ...p,
      images: Array.isArray(p.images) ? p.images : [],
    })),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}

// POST /api/admin/products — 新增产品
export async function POST(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await req.json();
    const { sku, name, description, categorySlug, brandSlug, images, specs, warranty, leadTime, payment, isHot } = data;

    if (!sku || !name) {
      return NextResponse.json({ error: "SKU 和名称不能为空" }, { status: 400 });
    }

    // 检查 SKU 是否已存在
    const existing = await prisma.product.findUnique({ where: { sku } });
    if (existing) {
      return NextResponse.json({ error: "SKU 已存在" }, { status: 409 });
    }

    // 查找分类和品牌
    const category = categorySlug
      ? await prisma.category.findUnique({ where: { slug: categorySlug } })
      : null;
    const brand = brandSlug
      ? await prisma.brand.findUnique({ where: { slug: brandSlug } })
      : null;

    const product = await prisma.product.create({
      data: {
        sku,
        name,
        description: description || null,
        categoryId: category?.id || null,
        brandId: brand?.id || null,
        images: images || [],
        specs: specs || null,
        warranty: warranty || null,
        leadTime: leadTime || null,
        payment: payment || null,
        isHot: isHot ?? false,
      },
    });

    return NextResponse.json({ ok: true, sku: product.sku });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PUT /api/admin/products — 更新产品
export async function PUT(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await req.json();
    const { sku, newSku, name, description, categorySlug, brandSlug, images, specs, warranty, leadTime, payment, isHot } = data;

    if (!sku) {
      return NextResponse.json({ error: "SKU 不能为空" }, { status: 400 });
    }

    const targetSku = newSku && newSku !== sku ? newSku : sku;

    // 先找到产品（优先用旧 SKU，找不到再用新 SKU 兜底）
    const product = await prisma.product.findUnique({ where: { sku } })
      ?? (newSku && newSku !== sku ? await prisma.product.findUnique({ where: { sku: newSku } }) : null);

    if (!product) {
      return NextResponse.json({
        error: `产品 ${sku} 不存在，请刷新页面后重试`,
        hint: "refresh",
      }, { status: 404 });
    }

    // 如果 SKU 有变动，检查新 SKU 是否已被其他产品占用
    if (newSku && newSku !== sku) {
      const conflict = await prisma.product.findUnique({ where: { sku: newSku } });
      if (conflict && conflict.id !== product.id) {
        return NextResponse.json({ error: "新 SKU 已被占用" }, { status: 400 });
      }
    }

    const category = categorySlug
      ? await prisma.category.findUnique({ where: { slug: categorySlug } })
      : null;
    const brand = brandSlug
      ? await prisma.brand.findUnique({ where: { slug: brandSlug } })
      : null;

    const updated = await prisma.product.update({
      where: { id: product.id },
      data: {
        ...(sku !== undefined ? { sku: targetSku } : {}),
        ...(name !== undefined ? { name } : {}),
        ...(description !== undefined ? { description: description || null } : {}),
        ...(categorySlug !== undefined ? { categoryId: category?.id || null } : {}),
        ...(brandSlug !== undefined ? { brandId: brand?.id || null } : {}),
        ...(images !== undefined ? { images: images || [] } : {}),
        ...(specs !== undefined ? { specs: specs || null } : {}),
        ...(warranty !== undefined ? { warranty: warranty || null } : {}),
        ...(leadTime !== undefined ? { leadTime: leadTime || null } : {}),
        ...(payment !== undefined ? { payment: payment || null } : {}),
        ...(isHot !== undefined ? { isHot: isHot ?? product.isHot } : {}),
      },
    });

    // 如果 SKU 变了，重命名图片文件夹
    if (newSku && newSku !== sku) {
      const fs = await import("fs");
      const oldDir = path.join(process.cwd(), "public", "uploads", sku);
      const newDir = path.join(process.cwd(), "public", "uploads", newSku);
      if (fs.existsSync(oldDir)) {
        fs.renameSync(oldDir, newDir);
      }
    }

    return NextResponse.json({ ok: true, sku: targetSku });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE /api/admin/products — 删除产品
export async function DELETE(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const sku = url.searchParams.get("sku");

  if (!sku) {
    return NextResponse.json({ error: "SKU 不能为空" }, { status: 400 });
  }

  try {
    await prisma.product.delete({ where: { sku } });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
