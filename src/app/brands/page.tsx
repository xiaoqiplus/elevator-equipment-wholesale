import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";

export default async function BrandsPage() {
  const brands = await prisma.brand.findMany({
    include: { _count: { select: { products: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold tracking-tight">品牌列表</h1>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {brands.map((brand) => (
          <Link key={brand.id} href={`/products?brand=${brand.slug}`}>
            <Card className="h-full transition-colors hover:bg-muted/50">
              <CardHeader>
                <div className="mb-3 flex h-16 items-center">
                  {brand.logoUrl ? (
                    <img
                      src={brand.logoUrl}
                      alt={brand.name}
                      className="max-h-12 max-w-32 object-contain"
                    />
                  ) : (
                    <div className="flex h-12 w-32 items-center justify-center rounded-md bg-muted">
                      <span className="text-sm text-muted-foreground">{brand.name}</span>
                    </div>
                  )}
                </div>
                <CardTitle className="text-lg">{brand.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {brand._count.products} 个产品
                </p>
                <div className="mt-4 flex items-center text-sm font-medium text-primary">
                  浏览产品 <ArrowRight className="ml-1 h-3 w-3" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {brands.length === 0 && (
        <p className="py-10 text-center text-muted-foreground">暂无品牌</p>
      )}
    </div>
  );
}
