import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Search" };

export default async function SearchPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const q = (searchParams.q || "").trim();

  const keywords = q.split(/\s+/).filter(Boolean);

  const products = keywords.length > 0
    ? await prisma.product.findMany({
        where: {
          AND: keywords.map((kw) => ({
            OR: [
              { name: { contains: kw, mode: "insensitive" } },
              { sku: { contains: kw, mode: "insensitive" } },
              { description: { contains: kw, mode: "insensitive" } },
            ],
          })),
        },
        select: {
          sku: true, name: true, description: true, images: true,
          category: { select: { name: true, slug: true } },
          brand: { select: { name: true, slug: true } },
        },
        orderBy: { name: "asc" },
        take: 100,
      })
    : [];

  return (
    <div>
      <section className="bg-slate-800 py-12 text-center text-white">
        <h1 className="text-3xl font-bold md:text-4xl">Search</h1>
        <p className="mt-2 text-slate-300">{q ? `Results for "${q}"` : "Search products"}</p>
      </section>

      <section className="container mx-auto px-4 py-10">
        {/* Search bar */}
        <div className="mx-auto mb-10 max-w-xl">
          <form action="/search" method="GET" className="relative">
            <input
              type="text"
              name="q"
              defaultValue={q}
              placeholder="Search products by name, SKU or description..."
              className="h-12 w-full rounded-lg border border-slate-300 bg-white px-4 pr-12 text-sm text-slate-800 placeholder:text-slate-400 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
              autoFocus
            />
            <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </button>
          </form>
        </div>

        {q && products.length === 0 && (
          <p className="py-20 text-center text-sm text-slate-400">No products found for &quot;{q}&quot;.</p>
        )}

        {products.length > 0 && (
          <>
            <p className="mb-6 text-sm text-slate-400">{products.length} result{products.length > 1 ? "s" : ""}</p>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {products.map((p) => (
                <Link key={p.sku} href={`/products/${p.sku}`}>
                  <Card className="h-full overflow-hidden transition-all hover:shadow-md hover:-translate-y-1">
                    <div className="aspect-square bg-slate-50 flex items-center justify-center">
                      {Array.isArray(p.images) && p.images[0] ? (
                        <img src={p.images[0]} alt={p.name} className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-4xl text-slate-300">🔧</span>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <div className="mb-2 flex items-center gap-2">
                        <Badge variant="secondary" className="font-mono text-xs">{p.sku}</Badge>
                        {p.brand && <span className="text-xs text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">{p.brand.name}</span>}
                      </div>
                      <h3 className="font-semibold text-slate-800 line-clamp-2 text-sm">{p.name}</h3>
                      {p.description && <p className="mt-1 text-xs text-slate-500 line-clamp-2">{p.description}</p>}
                      <div className="mt-2 text-xs text-slate-400">{p.category?.name}</div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </>
        )}

        {!q && (
          <div className="py-20 text-center">
            <p className="text-sm text-slate-400">Type a keyword above to search products.</p>
          </div>
        )}
      </section>
    </div>
  );
}
