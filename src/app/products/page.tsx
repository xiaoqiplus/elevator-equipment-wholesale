import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import ProductList from "@/components/products/ProductList";
import ProductFilters from "@/components/products/ProductFilters";

export const revalidate = 60;

export default async function ProductsPage(props: any = {}) {
  const { searchParams = {} } = props ?? {};

  const page = parseInt(searchParams.page ?? "1", 10) || 1;
  const search = searchParams.search ?? "";
  const category = searchParams.category ?? "";
  const brand = searchParams.brand ?? "";
  const pageSize = 10;
  const skip = (page - 1) * pageSize;

  let products: any[] = [];
  let total = 0;
  let fetchError: string | null = null;

  try {
    const where: Prisma.ProductWhereInput = {};

    if (category) where.category = { slug: category };
    if (brand) where.brand = { slug: brand };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { sku: { contains: search, mode: "insensitive" } },
      ];
    }

    const [results, count] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: pageSize,
        select: {
          sku: true,
          name: true,
          description: true,
          images: true,
          specs: true,
          category: { select: { name: true, slug: true } },
          brand: { select: { name: true, slug: true } },
        },
        orderBy: { name: "asc" },
      }),
      prisma.product.count({ where }),
    ]);

    products = results;
    total = count;
  } catch (err: any) {
    fetchError = err.message ?? "Unknown error";
  }

  return (
    <div className="container mx-auto space-y-6 px-4 py-8">
      <h1 className="text-3xl font-bold tracking-tight text-slate-800">产品中心</h1>
      <ProductFilters />
      <ProductList products={products} total={total} page={page} pageSize={pageSize} error={fetchError} />
    </div>
  );
}
