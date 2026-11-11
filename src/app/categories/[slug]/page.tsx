import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, X } from "lucide-react";
import type { Metadata } from "next";

export const revalidate = 60;

interface Props {
  params: { slug: string };
  searchParams?: { brand?: string; page?: string };
}

// 分类页是「elevator door parts」这类商业词的最佳落地页，
// 必须有自己的 title/description/自指 canonical。canonical 忽略 ?brand= 过滤参数，
// 让所有筛选视图归一到分类根 URL（否则每个品牌组合都会变成一条重复内容）。
// 分页则相反：?page=N 自指，否则第 2 页起的 47 个产品会全被判成重复内容。
export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const category = await prisma.category.findUnique({ where: { slug: params.slug } });
  if (!category) return { title: "Category Not Found", robots: { index: false, follow: true } };

  const pageNum = Math.max(1, parseInt(searchParams?.page || "1", 10) || 1);
  const hasBrandFilter = !!searchParams?.brand;
  const canonical = hasBrandFilter || pageNum <= 1
    ? `/categories/${category.slug}`
    : `/categories/${category.slug}?page=${pageNum}`;

  const count = await prisma.product.count({ where: { categoryId: category.id } }).catch(() => 0);
  const description = count > 0
    ? `${category.name}: ${count} elevator and escalator parts in stock, for Otis, Kone, Schindler, Mitsubishi, ThyssenKrupp and more. Fast worldwide dispatch, request a quote.`
    : `${category.name} for elevators and escalators. Fast worldwide dispatch, request a quote.`;

  const title = pageNum > 1
    ? `${category.name} — Page ${pageNum} | Elevator & Escalator Parts`
    : `${category.name} — Elevator & Escalator Parts`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      type: "website",
      url: canonical,
    },
  };
}

export default async function CategoryDetailPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { brand?: string; page?: string };
}) {
  const { slug } = params;
  const category = await prisma.category.findUnique({ where: { slug } });
  if (!category) notFound();

  const activeBrand = searchParams.brand || "";
  const pageNum = Math.max(1, parseInt(searchParams.page || "1", 10) || 1);

  // 该分类下所有品牌及其产品数
  const brandCounts = await prisma.product.groupBy({
    by: ["brandId"],
    where: { categoryId: category.id, brandId: { not: null } },
    _count: true,
  });
  const brandIds = brandCounts.map(b => b.brandId).filter(Boolean) as string[];
  const brands = await prisma.brand.findMany({
    where: { id: { in: brandIds } },
  });
  const brandMap = Object.fromEntries(brands.map(b => [b.id, b]));
  const brandList = brandCounts
    .map(bc => ({ ...brandMap[bc.brandId as string], count: bc._count }))
    .filter(b => b)
    .sort((a, b) => b.count - a.count);

  // 按品牌筛选产品
  const where: any = { categoryId: category.id };
  if (activeBrand) {
    const selectedBrand = brands.find(b => b.slug === activeBrand);
    if (selectedBrand) where.brandId = selectedBrand.id;
  }

  // ── 分页（2026-11-11）────────────────────────────────────────────────
  // 原来一次把该分类下所有产品全查出来渲染：最大的分类有 646 个产品，
  // 单页 HTML + RSC 载荷巨大，在共享主机上每访问一次就是一次重活。
  // 现在每页 48 条，count + 分页查询，首屏体积和内存都降了两个数量级。
  const PAGE_SIZE = 48;
  const [total, products] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      select: { sku: true, name: true, description: true, images: true,
        category: { select: { name: true, slug: true } },
        brand: { select: { name: true, slug: true } } },
      orderBy: { name: "asc" },
      skip: (pageNum - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // 分页/筛选链接要保留 brand 参数
  const pageHref = (n: number) => {
    const qs = new URLSearchParams();
    if (activeBrand) qs.set("brand", activeBrand);
    if (n > 1) qs.set("page", String(n));
    const q = qs.toString();
    return `/categories/${slug}${q ? `?${q}` : ""}`;
  };

  return (
    <div>
      <section className="border-b bg-slate-50">
        <div className="container mx-auto flex h-10 items-center gap-2 px-4 text-xs text-slate-400">
          <Link href="/" className="hover:text-slate-600">Home</Link>
          <span>/</span>
          <Link href="/products" className="hover:text-slate-600">Products</Link>
          <span>/</span>
          <span className="text-slate-600">{category.name}</span>
        </div>
      </section>

      <section className="container mx-auto px-4 py-10">
        <div className="mb-6 flex items-center gap-4">
          <Link href="/products" className="text-slate-400 hover:text-slate-600">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-bold text-slate-800">{category.name}</h1>
          <Badge variant="secondary" className="text-sm px-3 py-1">{total} items</Badge>
          {activeBrand && (
            <Badge className="bg-slate-800 text-white text-sm px-3 py-1">
              {brandList.find(b => b.slug === activeBrand)?.name || activeBrand}
            </Badge>
          )}
        </div>

        {/* 品牌筛选 */}
        {brandList.length > 0 && (
          <div className="mb-8">
            <p className="mb-3 text-sm font-semibold text-slate-500 uppercase tracking-wider">Filter by Brand</p>
            <div className="flex flex-wrap gap-3">
              {activeBrand && (
                <Link href={`/categories/${slug}`}>
                  <Button variant="outline" size="default" className="text-sm gap-2 px-4 py-2 h-auto">
                    <X className="h-4 w-4" /> Clear
                  </Button>
                </Link>
              )}
              {brandList.map((brand) => {
                const isActive = brand.slug === activeBrand;
                return (
                  <Link key={brand.id} href={`/categories/${slug}?brand=${brand.slug}`}>
                    <Button
                      variant={isActive ? "default" : "outline"}
                      size="default"
                      className={`text-sm px-4 py-2 h-auto ${isActive ? "bg-slate-800" : ""}`}
                    >
                      {brand.name} ({brand.count})
                    </Button>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* 产品网格 */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((p) => (
            <Link key={p.sku} href={`/products/${p.sku}`} prefetch={false}>
              <Card className="h-full overflow-hidden transition-all hover:shadow-md hover:-translate-y-1">
                <div className="aspect-square bg-slate-50 flex items-center justify-center">
                  {Array.isArray(p.images) && p.images[0] ? (
                    <img src={p.images[0] as string} alt={p.name} className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-4xl text-slate-300">🔧</span>
                  )}
                </div>
                <CardContent className="p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <Badge variant="secondary" className="font-mono text-xs">{p.sku}</Badge>
                    {p.brand && (
                      <span className="text-xs text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">{p.brand.name}</span>
                    )}
                  </div>
                  <h3 className="font-semibold text-slate-800 line-clamp-2 text-sm">{p.name}</h3>
                  {p.description && <p className="mt-1 text-xs text-slate-500 line-clamp-2">{p.description}</p>}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {products.length === 0 && (
          <p className="py-20 text-center text-sm text-slate-400">No products found.</p>
        )}

        {/* 分页导航：不预取，减少后台请求；页数多的分类只暴露首尾+邻近页 */}
        {totalPages > 1 && (
          <nav className="mt-10 flex flex-wrap items-center justify-center gap-2 text-sm" aria-label="Pagination">
            {pageNum > 1 && (
              <Link href={pageHref(pageNum - 1)} prefetch={false}
                className="rounded-md border px-3 py-1.5 text-slate-600 hover:bg-slate-50">‹ Prev</Link>
            )}
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(n => n === 1 || n === totalPages || Math.abs(n - pageNum) <= 2)
              .map((n, idx, arr) => (
                <span key={n} className="flex items-center gap-2">
                  {idx > 0 && arr[idx - 1] !== n - 1 && <span className="text-slate-300">…</span>}
                  <Link href={pageHref(n)} prefetch={false}
                    className={`rounded-md border px-3 py-1.5 ${n === pageNum ? "bg-slate-800 text-white border-slate-800" : "text-slate-600 hover:bg-slate-50"}`}>
                    {n}
                  </Link>
                </span>
              ))}
            {pageNum < totalPages && (
              <Link href={pageHref(pageNum + 1)} prefetch={false}
                className="rounded-md border px-3 py-1.5 text-slate-600 hover:bg-slate-50">Next ›</Link>
            )}
          </nav>
        )}
      </section>
    </div>
  );
}
