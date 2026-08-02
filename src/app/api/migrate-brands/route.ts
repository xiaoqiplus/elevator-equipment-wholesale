import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// 指定归入「其他」的品牌（用户明确列出的）
const OTHER_LIST = [
  "selcom", "heidenhain", "aodepu", "sematic", "omron", "nbsl",
  "schmersal", "tamagawa", "simider", "ouling", "wittur", "autonics",
  "siei", "bernstein", "xinda", "fujihd", "eshine",
];

// Kubler 及之后（按产品数排序）归入「其他」
const KUBLER_AFTER = [
  "kubler", "panasonic", "step", "sanrex", "lg-sigma", "tjsr", "hpmont",
  "bst", "weco", "guangri", "hohner", "yaskawa", "cedes", "vacon", "suns",
  "mayr", "axxon-safe", "shenghao", "sanei", "sigma/thyssenkrupp", "emerson",
  "turck", "sigma-tke", "weton", "elgo", "tend", "volkslift", "baumer",
  "qma", "giantkone", "arkel", "lg-sigma-xizi-otis", "sanyo-xj-schindler",
  "tofi", "derin", "hengstler", "ls", "ningbo-xinda", "ife", "hunter",
  "diro", "ehc", "elco", "schrack", "xizi-forvorda", "abb", "sunny",
  "syney", "hitachi/guangri", "edunburgh", "gustav-wolf", "volks",
  "schneider", "siemens-apt", "keb", "sft", "astra", "toshiba-/-fujitec",
  "idec", "siemens",
];

// 品牌替换映射
const BRAND_REPLACE: Record<string, string> = {
  "xizi-otis": "otis",
  "thyssenkrupp": "tke",
  "inovance": "monarch",
};

export async function GET() {
  const results: any = {};

  // ── 1. 品牌替换 ──
  results.replace = [];
  for (const [fromSlug, toSlug] of Object.entries(BRAND_REPLACE)) {
    const from = await prisma.brand.findUnique({ where: { slug: fromSlug } });
    const to = await prisma.brand.findUnique({ where: { slug: toSlug } });
    if (!from || !to) { results.replace.push({ fromSlug, toSlug, error: "品牌不存在" }); continue; }
    const r = await prisma.product.updateMany({
      where: { brandId: from.id },
      data: { brandId: to.id },
    });
    results.replace.push({ fromSlug, toSlug, moved: r.count });
  }

  // ── 2. 创建「其他」品牌 ──
  let other = await prisma.brand.findUnique({ where: { slug: "other" } });
  if (!other) {
    other = await prisma.brand.create({ data: { name: "其他", slug: "other" } });
  }

  // 收集归入其他的品牌 slug
  const allOtherSlugs = [...new Set([...OTHER_LIST, ...KUBLER_AFTER])];
  results.toOther = [];
  for (const slug of allOtherSlugs) {
    const b = await prisma.brand.findUnique({ where: { slug } });
    if (!b) { results.toOther.push({ slug, error: "品牌不存在" }); continue; }
    // 跳过 inovance（已归 monarch）
    if (slug === "inovance") continue;
    const r = await prisma.product.updateMany({
      where: { brandId: b.id },
      data: { brandId: other.id },
    });
    results.toOther.push({ slug, moved: r.count });
  }

  // ── 3. 创建 Schindler ──
  let schindler = await prisma.brand.findUnique({ where: { slug: "schindler" } });
  if (!schindler) {
    schindler = await prisma.brand.create({ data: { name: "Schindler", slug: "schindler" } });
  }
  results.schindler = "ok";

  // ── 4. 删除空品牌 ──
  const emptyBrands = await prisma.brand.findMany({
    where: { products: { none: {} } },
    select: { id: true, name: true, slug: true },
  });
  results.deletedBrands = [];
  for (const b of emptyBrands) {
    await prisma.brand.delete({ where: { id: b.id } });
    results.deletedBrands.push(b.slug);
  }

  // ── 5. 分类合并：所有 elevator-pcb-* 归到 elevator-pcb ──
  const pcbMain = await prisma.category.findUnique({ where: { slug: "elevator-pcb" } });
  if (pcbMain) {
    const pcbCats = await prisma.category.findMany({
      where: { OR: [{ slug: { startsWith: "elevator-pcb-" } }, { slug: "kone-elevator-pcb" }] },
      select: { id: true, slug: true, name: true },
    });
    results.mergedCats = [];
    for (const c of pcbCats) {
      const r = await prisma.product.updateMany({
        where: { categoryId: c.id },
        data: { categoryId: pcbMain.id },
      });
      results.mergedCats.push({ slug: c.slug, moved: r.count });
      await prisma.category.delete({ where: { id: c.id } });
    }
  } else {
    results.mergedCats = [{ error: "elevator-pcb 分类不存在" }];
  }

  // ── 6. 删除空分类（除了保留的大类） ──
  const emptyCats = await prisma.category.findMany({
    where: { products: { none: {} } },
    select: { id: true, slug: true, name: true },
  });
  results.deletedCats = [];
  for (const c of emptyCats) {
    await prisma.category.delete({ where: { id: c.id } });
    results.deletedCats.push(c.slug);
  }

  // ── 汇总 ──
  const [brandCount, catCount, prodCount] = await Promise.all([
    prisma.brand.count(),
    prisma.category.count(),
    prisma.product.count(),
  ]);
  results.summary = { brands: brandCount, categories: catCount, products: prodCount };

  return NextResponse.json(results);
}
