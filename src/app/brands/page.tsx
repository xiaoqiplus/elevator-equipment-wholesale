import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Elevator Parts by Brand",
  description:
    "Browse elevator and escalator spare parts by manufacturer: Otis, Kone, Schindler, Mitsubishi, ThyssenKrupp, Hitachi, Fujitec and more.",
  alternates: { canonical: "/brands" },
};

export default async function BrandsPage() {
  const brands = await prisma.brand.findMany({
    include: { _count: { select: { products: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 全站面向海外采购商，文案必须是英文 */}
      <h1 className="mb-8 text-3xl font-bold tracking-tight">Elevator Parts by Brand</h1>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {brands.map((brand) => (
          // 指向真实的品牌落地页 /brands/[slug]；
          // 原先指 /products?brand=xxx，但 /products 根本不处理 brand 参数，等于死链
          <Link key={brand.id} href={`/brands/${brand.slug}`}>
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
                  {brand._count.products} products
                </p>
                <div className="mt-4 flex items-center text-sm font-medium text-primary">
                  View parts <ArrowRight className="ml-1 h-3 w-3" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {brands.length === 0 && (
        <p className="py-10 text-center text-muted-foreground">No brands found.</p>
      )}
    </div>
  );
}
