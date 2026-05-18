import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ProductList from "@/components/products/ProductList";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function CategoryDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const { slug } = params;

  const category = await prisma.category.findUnique({
    where: { slug },
  });

  if (!category) notFound();

  const products = await prisma.product.findMany({
    where: { categoryId: category.id },
    include: { category: true, brand: true, documents: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <Link
        href="/categories"
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        返回分类列表
      </Link>

      <h1 className="mb-8 text-3xl font-bold tracking-tight">{category.name}</h1>

      <ProductList
        products={products.map((p) => ({
          sku: p.sku,
          name: p.name,
          description: p.description ?? undefined,
          price: null,
          images: p.images,
          specs: p.specs as Record<string, unknown> | null,
          category: p.category ? { name: p.category.name, slug: p.category.slug } : null,
          brand: p.brand ? { name: p.brand.name, slug: p.brand.slug } : null,
        }))}
        total={products.length}
        page={1}
        pageSize={100}
        loading={false}
      />
    </div>
  );
}
