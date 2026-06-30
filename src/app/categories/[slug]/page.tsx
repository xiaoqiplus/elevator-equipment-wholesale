import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";

export const revalidate = 60;

export default async function CategoryDetailPage({ params }: { params: { slug: string } }) {
  const { slug } = params;
  const category = await prisma.category.findUnique({ where: { slug } });
  if (!category) notFound();

  const products = await prisma.product.findMany({
    where: { categoryId: category.id },
    select: { sku: true, name: true, description: true, images: true, specs: true,
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
        <div className="mb-8 flex items-center gap-3">
          <Link href="/products" className="text-slate-400 hover:text-slate-600">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <h1 className="text-2xl font-bold text-slate-800">{category.name}</h1>
          <Badge variant="secondary" className="text-xs">{products.length} items</Badge>
        </div>

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
                  <Badge variant="secondary" className="mb-2 font-mono text-xs">{p.sku}</Badge>
                  <h3 className="mb-1 font-semibold text-slate-800 line-clamp-2">{p.name}</h3>
                  {p.description && <p className="mb-2 text-xs text-slate-500 line-clamp-2">{p.description}</p>}
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    {p.brand && <span>{p.brand.name}</span>}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {products.length === 0 && (
          <p className="py-20 text-center text-sm text-slate-400">No products in this category yet.</p>
        )}
      </section>
    </div>
  );
}
