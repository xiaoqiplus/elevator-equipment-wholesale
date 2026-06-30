import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const revalidate = 60;

export default async function ProductsPage(props: any = {}) {
  const { searchParams = {} } = props ?? {};
  const page = parseInt(searchParams.page ?? "1", 10) || 1;
  const pageSize = 20;
  const skip = (page - 1) * pageSize;

  const where: Prisma.ProductWhereInput = {};
  try {
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where, skip, take: pageSize,
        select: { sku: true, name: true, description: true, images: true, specs: true,
          category: { select: { name: true, slug: true } },
          brand: { select: { name: true, slug: true } } },
        orderBy: { name: "asc" },
      }),
      prisma.product.count({ where }),
    ]);

    const totalPages = Math.ceil(total / pageSize);

    return (
      <div>
        <section className="bg-slate-800 py-12 text-center text-white">
          <h1 className="text-3xl font-bold md:text-4xl">Products</h1>
          <p className="mt-2 text-slate-300">High Quality Elevator Parts</p>
        </section>

        <section className="container mx-auto px-4 py-10">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {products.map((p) => (
              <Link key={p.sku} href={`/products/${p.sku}`}>
                <Card className="h-full overflow-hidden transition-all hover:shadow-md hover:-translate-y-1">
                  <div className="aspect-square bg-slate-100 flex items-center justify-center">
                    <span className="text-4xl text-slate-300">🔧</span>
                  </div>
                  <CardContent className="p-4">
                    <Badge variant="secondary" className="mb-2 font-mono text-xs">{p.sku}</Badge>
                    <h3 className="mb-1 font-semibold text-slate-800 line-clamp-2">{p.name}</h3>
                    {p.description && <p className="mb-2 text-xs text-slate-500 line-clamp-2">{p.description}</p>}
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      {p.category && <span>{p.category.name}</span>}
                      {p.brand && <span>{p.brand.name}</span>}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-10 flex items-center justify-center gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <Link key={p} href={`/products?page=${p}`}
                  className={`inline-flex h-9 w-9 items-center justify-center rounded-md text-sm ${p === page ? "bg-slate-800 text-white" : "border text-slate-600 hover:bg-slate-50"}`}>
                  {p}
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    );
  } catch (err: any) {
    return (
      <div>
        <section className="bg-slate-800 py-12 text-center text-white">
          <h1 className="text-3xl font-bold md:text-4xl">Products</h1>
        </section>
        <section className="container mx-auto px-4 py-20 text-center">
          <p className="text-slate-500">Unable to load products. Database connection issue.</p>
        </section>
      </div>
    );
  }
}
