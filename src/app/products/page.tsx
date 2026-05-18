import ProductList from "@/components/products/ProductList";
import ProductFilters from "@/components/products/ProductFilters";

export default async function ProductsPage(props: any = {}) {
  const { searchParams = {} } = props ?? {};

  const page = parseInt(searchParams.page ?? "1", 10) || 1;
  const search = searchParams.search ?? "";
  const category = searchParams.category ?? "";
  const brand = searchParams.brand ?? "";
  const pageSize = 10;

  let products: any[] = [];
  let total = 0;
  let fetchError: string | null = null;

  try {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("pageSize", String(pageSize));
    if (search) params.set("search", search);
    if (category) params.set("category", category);
    if (brand) params.set("brand", brand);

    const res = await fetch(
      `${
        process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000"
      }/api/products?${params.toString()}`,
      { cache: "no-store" }
    );

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();
    products = data.products ?? [];
    total = data.total ?? 0;
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
