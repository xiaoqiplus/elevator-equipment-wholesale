import ProductForm from "@/components/admin/ProductForm";

export default async function EditProductPage({
  params,
  searchParams,
}: {
  params: { sku: string };
  searchParams: { from?: string };
}) {
  return <ProductForm sku={params.sku} from={searchParams?.from || ""} />;
}
