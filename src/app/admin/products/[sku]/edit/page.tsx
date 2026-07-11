import ProductForm from "@/components/admin/ProductForm";

export default async function EditProductPage({ params }: { params: { sku: string } }) {
  return <ProductForm sku={params.sku} />;
}
