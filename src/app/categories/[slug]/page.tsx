import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, X } from "lucide-react";

export const revalidate = 60;

export default async function CategoryDetailPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { brand?: string };
}) {
  const { slug } = params;
  const category = await prisma.category.findUnique({ where: { slug } });
  if (!category) notFound();

  const activeBrand = searchParams.brand || "";

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

  const products = await prisma.product.findMany({
    where,
    select: { sku: true, name: true, description: true, images: true,
      category: { select: { name: true, slug: true } },
      brand: { select: { name: true, slug: true } } },
    orderBy: { name: "asc" },
  });

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
          <Badge variant="secondary" className="text-sm px-3 py-1">{products.length} items</Badge>
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
            <Link key={p.sku} href={`/products/${p.sku}`}>
              <Card className="h-full overflow-hidden transition-all hover:shadow-md hover:-translate-y-1">
                <div className="aspect-square bg-slate-50 flex items-center justify-center">
                  {p.images && p.images[0] ? (
                    <img src={p.images[0]} alt={p.name} className="h-full w-full object-cover" />
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
      </section>
    </div>
  );
}
