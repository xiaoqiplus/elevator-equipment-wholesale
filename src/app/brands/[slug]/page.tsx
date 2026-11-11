import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, X } from "lucide-react";
import type { Metadata } from "next";

interface BrandProps {
  params: { slug: string };
  searchParams?: { category?: string; page?: string };
}

// 品牌页同样是商业落地页（"Otis elevator parts"），必须自指 canonical，
// 并忽略 ?category= 过滤参数；但 ?page=N 要自指，否则第 2 页起的产品会被判重复内容。
export async function generateMetadata({ params, searchParams }: BrandProps): Promise<Metadata> {
  const brand = await prisma.brand.findUnique({ where: { slug: params.slug } });
  if (!brand) return { title: "Brand Not Found", robots: { index: false, follow: true } };

  const pageNum = Math.max(1, parseInt(searchParams?.page || "1", 10) || 1);
  const hasCatFilter = !!searchParams?.category;
  const canonical = hasCatFilter || pageNum <= 1
    ? `/brands/${brand.slug}`
    : `/brands/${brand.slug}?page=${pageNum}`;

  const count = await prisma.product.count({ where: { brandId: brand.id } }).catch(() => 0);
  const description = count > 0
    ? `${brand.name} elevator and escalator spare parts — ${count} items available. OEM and compatible components with fast worldwide shipping.`
    : `${brand.name} elevator and escalator spare parts. Fast worldwide shipping.`;

  const title = pageNum > 1
    ? `${brand.name} Elevator Parts — Page ${pageNum}`
    : `${brand.name} Elevator Parts`;

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

export default async function BrandDetailPage({
  params, searchParams,
}: {
  params: { slug: string };
  searchParams: { category?: string; page?: string };
}) {
  const brand = await prisma.brand.findUnique({ where: { slug: params.slug } });
  if (!brand) notFound();

  const activeCat = searchParams.category || "";
  const pageNum = Math.max(1, parseInt(searchParams.page || "1", 10) || 1);

  // 该品牌下所有分类及其产品数
  const catCounts = await prisma.product.groupBy({
    by: ["categoryId"],
    where: { brandId: brand.id, categoryId: { not: null } },
    _count: true,
  });
  const catIds = catCounts.map(c => c.categoryId).filter(Boolean) as string[];
  const cats = await prisma.category.findMany({ where: { id: { in: catIds } } });
  const catList = catCounts
    .map(cc => ({ ...cats.find(c => c.id === cc.categoryId), count: cc._count }))
    .filter(Boolean)
    .sort((a: any, b: any) => b.count - a.count);

  // 按分类筛选
  const where: any = { brandId: brand.id };
  if (activeCat) {
    const selectedCat = cats.find(c => c.slug === activeCat);
    if (selectedCat) where.categoryId = selectedCat.id;
  }

  // 分页，理由同分类页：大品牌（如 Otis/Kone）一次全渲染会拖垮共享主机
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

  const pageHref = (n: number) => {
    const qs = new URLSearchParams();
    if (activeCat) qs.set("category", activeCat);
    if (n > 1) qs.set("page", String(n));
    const q = qs.toString();
    return `/brands/${params.slug}${q ? `?${q}` : ""}`;
  };

  return (
    <div>
      <section className="border-b bg-slate-50">
        <div className="container mx-auto flex h-10 items-center gap-2 px-4 text-xs text-slate-400">
          <Link href="/" className="hover:text-slate-600">Home</Link>
          <span>/</span>
          <Link href="/products?view=brands" className="hover:text-slate-600">Brands</Link>
          <span>/</span>
          <span className="text-slate-600">{brand.name}</span>
        </div>
      </section>

      <section className="container mx-auto px-4 py-10">
        <div className="mb-6 flex items-center gap-4">
          <Link href="/products?view=brands" className="text-slate-400 hover:text-slate-600">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-bold text-slate-800">{brand.name}</h1>
          <Badge variant="secondary" className="text-sm px-3 py-1">{total} items</Badge>
          {activeCat && (
            <Badge className="bg-slate-800 text-white text-sm px-3 py-1">
              {catList.find((c: any) => c.slug === activeCat)?.name || activeCat}
            </Badge>
          )}
        </div>

        {catList.length > 0 && (
          <div className="mb-8">
            <p className="mb-3 text-sm font-semibold text-slate-500 uppercase tracking-wider">Filter by Category</p>
            <div className="flex flex-wrap gap-3">
              {activeCat && (
                <Link href={`/brands/${params.slug}`}>
                  <Button variant="outline" size="default" className="text-sm gap-2 px-4 py-2 h-auto">
                    <X className="h-4 w-4" /> Clear
                  </Button>
                </Link>
              )}
              {catList.map((cat: any) => (
                <Link key={cat.id} href={`/brands/${params.slug}?category=${cat.slug}`}>
                  <Button
                    variant={cat.slug === activeCat ? "default" : "outline"}
                    size="default"
                    className={`text-sm px-4 py-2 h-auto ${cat.slug === activeCat ? "bg-slate-800" : ""}`}
                  >
                    {cat.name} ({cat.count})
                  </Button>
                </Link>
              ))}
            </div>
          </div>
        )}

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
                    {p.category && <span className="text-xs text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">{p.category.name}</span>}
                  </div>
                  <h3 className="font-semibold text-slate-800 line-clamp-2 text-sm">{p.name}</h3>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {products.length === 0 && (
          <p className="py-20 text-center text-sm text-slate-400">No products found.</p>
        )}

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
