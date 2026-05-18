import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import ProductList from "@/components/products/ProductList";
import ProductFilters from "@/components/products/ProductFilters";

// ISR: re-generate every 60 seconds if there's traffic
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

    // Only fetch fields we need for the list view — skip documents & full specs
    const [results, count] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: pageSize,
        select: {
          sku: true,
          name: true,
          description: true,
          price: true,
          images: true,
          specs: true,
          category: { select: { name: true, slug: true } },
          brand: { select: { name: true, slug: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.product.count({ where }),
    ]);

    products = results.map((p) => ({
      sku: p.sku,
      name: p.name,
      description: p.description ?? undefined,
      price: null,
      images: p.images,
      specs: p.specs as Record<string, unknown> | null,
      category: p.category ? { name: p.category.name, slug: p.category.slug } : null,
      brand: p.brand ? { name: p.brand.name, slug: p.brand.slug } : null,
    }));
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
      />
    </div>
  );
}
