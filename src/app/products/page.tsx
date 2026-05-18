import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import ProductList from "@/components/products/ProductList";
import ProductFilters from "@/components/products/ProductFilters";

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

    if (category) {
      where.category = { slug: category };
    }
    if (brand) {
      where.brand = { slug: brand };
    }
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
        include: { category: true, brand: true, documents: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.product.count({ where }),
    ]);

    products = results.map((p) => ({ ...p, price: null }));
    total = count;
  } catch (err) {
    fetchError = err instanceof Error ? err.message : "获取产品列表失败";
  }

  const initialFilters = { search, category, brand };

  return (
    <div className="container mx-auto space-y-6 px-4 py-8">
      <h1 className="text-3xl font-bold tracking-tight">产品列表</h1>
      <ProductFilters initialFilters={initialFilters} />
      <ProductList
        products={products}
        total={total}
        page={page}
        pageSize={pageSize}
        loading={false}
        error={fetchError}
        onRetry={() => {}}
      />
    </div>
  );
}
