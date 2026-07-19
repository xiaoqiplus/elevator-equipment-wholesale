import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Elevator Parts & Components | Quick Easy Lift Parts",
  description: "Browse our catalog of high-quality elevator parts, elevator components, and lift accessories. Fast shipping worldwide.",
  keywords: "elevator parts, elevator components, lift parts, elevator accessories, elevator equipment",
  openGraph: {
    title: "Elevator Parts & Components | Quick Easy Lift Parts",
    description: "Browse our catalog of high-quality elevator parts, elevator components, and lift accessories.",
    type: "website",
  },
};

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: { view?: string; q?: string };
}) {
  const view = searchParams.view === "brands" ? "brands" : "categories";
  const q = (searchParams.q || "").trim();
  const whereName = q ? { name: { contains: q, mode: "insensitive" as const } } : {};

  // 分类视图
  if (view === "brands") {
    const brands = await prisma.brand.findMany({
      where: whereName,
      include: { _count: { select: { products: true } } },
      orderBy: { products: { _count: "desc" } },
    });

    return (
      <div>
        <section className="bg-slate-800 py-12 text-center text-white">
          <h1 className="text-3xl font-bold md:text-4xl">Products</h1>
          <p className="mt-2 text-slate-300">Browse by Category or Brand</p>
        </section>
        <section className="container mx-auto px-4 py-10">
          <div className="mx-auto mb-8 max-w-xl">
            <form action="/products" method="GET" className="relative">
              <input type="hidden" name="view" value="brands" />
              <input type="text" name="q" defaultValue={q} placeholder="Search brands..."
                className="h-12 w-full rounded-lg border border-slate-300 bg-white px-4 pr-12 text-sm text-slate-800 placeholder:text-slate-400 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500" />
              <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </button>
            </form>
          </div>
          <div className="mb-8 flex justify-center gap-4">
            <Button variant="outline" asChild size="lg" className="text-base px-6">
              <Link href={`/products${q ? `?q=${q}` : ""}`}>By Category</Link>
            </Button>
            <Button asChild size="lg" className="bg-slate-800 text-base px-6">
              <Link href={`/products?view=brands${q ? `&q=${q}` : ""}`}>By Brand</Link>
            </Button>
          </div>
          {q && <p className="mb-4 text-xs text-slate-400">{brands.length} brand{brands.length !== 1 ? "s" : ""} matching &quot;{q}&quot;</p>}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {brands.map((brand) => (
              <Link key={brand.id} href={`/brands/${brand.slug}`}>
                <Card className="flex items-center gap-4 p-5 transition-all hover:shadow-md hover:-translate-y-0.5">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-lg font-bold text-slate-700">{brand.name[0]}</div>
                  <div>
                    <h3 className="font-semibold text-slate-800">{brand.name}</h3>
                    <p className="text-xs text-slate-400">{brand._count.products} products</p>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      </div>
    );
  }

  // 分类视图
  const categories = await prisma.category.findMany({
    where: whereName,
    include: {
      products: { take: 1, select: { images: true }, orderBy: { name: "asc" } },
      _count: { select: { products: true } },
    },
    orderBy: { products: { _count: "desc" } },
  });

  return (
    <div>
      <section className="bg-slate-800 py-12 text-center text-white">
        <h1 className="text-3xl font-bold md:text-4xl">Products</h1>
        <p className="mt-2 text-slate-300">Browse by Category or Brand</p>
      </section>
      <section className="container mx-auto px-4 py-10">
        <div className="mx-auto mb-8 max-w-xl">
          <form action="/products" method="GET" className="relative">
            <input type="text" name="q" defaultValue={q} placeholder="Search categories..."
              className="h-12 w-full rounded-lg border border-slate-300 bg-white px-4 pr-12 text-sm text-slate-800 placeholder:text-slate-400 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500" />
            <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </button>
          </form>
        </div>
        <div className="mb-8 flex justify-center gap-4">
          <Button asChild size="lg" className="bg-slate-800 text-base px-6">
            <Link href={`/products${q ? `?q=${q}` : ""}`}>By Category</Link>
          </Button>
          <Button variant="outline" asChild size="lg" className="text-base px-6">
            <Link href={`/products?view=brands${q ? `&q=${q}` : ""}`}>By Brand</Link>
          </Button>
        </div>
        {q && <p className="mb-4 text-xs text-slate-400">{categories.length} categor{categories.length !== 1 ? "ies" : "y"} matching &quot;{q}&quot;</p>}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {categories.map((cat) => (
            <Link key={cat.id} href={`/categories/${cat.slug}`}>
              <Card className="h-full overflow-hidden transition-all hover:shadow-md hover:-translate-y-1">
                <div className="aspect-video bg-slate-50 flex items-center justify-center overflow-hidden">
                  {Array.isArray(cat.products[0]?.images) && cat.products[0].images[0] ? (
                    <img src={cat.products[0].images[0] as string} alt={cat.name} className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-3xl text-slate-300">📦</span>
                  )}
                </div>
                <CardContent className="p-5">
                  <h3 className="mb-1 font-semibold text-slate-800">{cat.name}</h3>
                  <p className="text-xs text-slate-400">{cat._count.products} products</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
