import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Products", description: "Elevator Parts Product Categories" };

export default async function ProductsPage() {
  const categories = await prisma.category.findMany({
    include: {
      products: {
        take: 1,
        select: { images: true },
        orderBy: { name: "asc" },
      },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <section className="bg-slate-800 py-12 text-center text-white">
        <h1 className="text-3xl font-bold md:text-4xl">Products</h1>
        <p className="mt-2 text-slate-300">Browse by Category</p>
      </section>

      <section className="container mx-auto px-4 py-12">
        {categories.length === 0 ? (
          <p className="py-20 text-center text-sm text-slate-400">No categories yet.</p>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {categories.map((cat) => {
              const firstImg = cat.products[0]?.images?.[0];
              return (
                <Link key={cat.id} href={`/categories/${cat.slug}`}>
                  <Card className="h-full overflow-hidden transition-all hover:shadow-md hover:-translate-y-1">
                    <div className="aspect-video bg-slate-100 flex items-center justify-center overflow-hidden">
                      {firstImg ? (
                        <img src={firstImg} alt={cat.name} className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-4xl text-slate-300">📦</span>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <h2 className="font-semibold text-slate-800 text-center">{cat.name}</h2>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
