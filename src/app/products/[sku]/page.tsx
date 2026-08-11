import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ProductInquiryForm from "@/components/ProductInquiryForm";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import ProductGallery from "@/components/ProductGallery";
import type { Metadata } from "next";

export const dynamic = 'force-dynamic';

interface Props { params: { sku: string } }

async function getProduct(sku: string) {
  return prisma.product.findUnique({
    where: { sku },
    include: { category: true, brand: true },
  });
}

// 相关产品：同分类的其他产品
async function getRelatedProducts(product: any) {
  if (!product.categoryId) return [];
  return prisma.product.findMany({
    where: { categoryId: product.categoryId, sku: { not: product.sku } },
    select: { sku: true, name: true, images: true },
    orderBy: { name: "asc" },
    take: 4,
  });
}

// 热销产品：isHot=true
async function getHotProducts(product: any) {
  return prisma.product.findMany({
    where: { isHot: true, sku: { not: product.sku } },
    select: { sku: true, name: true, images: true },
    orderBy: { updatedAt: "desc" },
    take: 4,
  });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await getProduct(params.sku);
  if (!product) return { title: "Product Not Found" };
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://quickeaseliftparts.com";
  const description = product.description?.replace(/<[^>]*>/g, "").slice(0, 160) || `High-quality elevator component ${product.sku}`;
  return {
    title: `${product.name} | Quick Easy Lift Parts`,
    description,
    keywords: ["elevator parts", "elevator components", product.sku, product.name, product.category?.name].filter(Boolean).join(", "),
    openGraph: {
      title: product.name,
      description,
      url: `${baseUrl}/products/${product.sku}`,
      siteName: "Quick Easy Lift Parts",
      type: "website",
      images: Array.isArray(product.images) && product.images.length > 0
        ? [{ url: `${baseUrl}${String(product.images[0])}`, width: 800, height: 600 }]
        : [],
    },
    twitter: {
      card: "summary_large_image",
      title: product.name,
      description,
    },
    alternates: { canonical: `${baseUrl}/products/${product.sku}` },
  };
}

export default async function ProductDetailPage({ params }: Props) {
  const { sku } = params;
  if (!sku) notFound();

  let product: any = null;
  try { product = await getProduct(sku); } catch { /* ignore */ }
  if (!product) notFound();

  // 相关产品 + 热销产品
  let relatedProducts: any[] = [];
  let hotProducts: any[] = [];
  try {
    [relatedProducts, hotProducts] = await Promise.all([
      getRelatedProducts(product),
      getHotProducts(product),
    ]);
  } catch { /* ignore */ }

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumb */}
      <div className="border-b bg-slate-50">
        <div className="container mx-auto flex h-10 items-center gap-2 px-4 text-xs text-slate-400">
          <Link href="/" className="hover:text-slate-600">Home</Link>
          <span>/</span>
          {product.category && (
            <><Link href={`/categories/${product.category.slug}`} className="hover:text-slate-600">{product.category.name}</Link><span>/</span></>
          )}
          <span className="text-slate-600">{product.name}</span>
        </div>
      </div>

      <section className="container mx-auto px-4 py-10">
        <div className="grid gap-8 lg:grid-cols-[200px_1fr_320px]">
          {/* ── Left: Images ── */}
          <ProductGallery images={Array.isArray(product.images) ? product.images : []} name={product.name} />

          {/* ── Center: Info ── */}
          <div className="space-y-6">
            <div>
              <Badge variant="secondary" className="mb-2 font-mono text-xs">{product.sku}</Badge>
              <h1 className="text-2xl font-bold text-slate-800 md:text-3xl">{product.name}</h1>
            </div>

            <div className="flex flex-wrap gap-4 text-sm text-slate-500">
              {product.category && <span>Category: <Link href={`/categories/${product.category.slug}`} className="text-slate-700 hover:underline">{product.category.name}</Link></span>}
              {product.brand && <span>Brand: <span className="text-slate-700">{product.brand.name}</span></span>}
            </div>

            <Separator />

            {/* 4 行产品信息 */}
            <div className="space-y-3">
              <div>
                <h2 className="mb-1 text-base font-semibold text-slate-800">Description</h2>
                <p className="text-sm text-slate-600 leading-relaxed">{product.description || "—"}</p>
              </div>
              <div className="rounded-lg border border-slate-100 divide-y divide-slate-100 text-sm">
                <div className="flex px-4 py-2.5">
                  <span className="w-28 shrink-0 font-medium text-slate-500">Warranty</span>
                  <span className="text-slate-800">{product.warranty || "—"}</span>
                </div>
                <div className="flex px-4 py-2.5">
                  <span className="w-28 shrink-0 font-medium text-slate-500">Lead Time</span>
                  <span className="text-slate-800">{product.leadTime || "—"}</span>
                </div>
                <div className="flex px-4 py-2.5">
                  <span className="w-28 shrink-0 font-medium text-slate-500">Payment</span>
                  <span className="text-slate-800">{product.payment || "—"}</span>
                </div>
              </div>
            </div>

            <Separator />

            {product.specs && Object.keys(product.specs).length > 0 && (
              <div>
                <h2 className="mb-3 text-base font-semibold text-slate-800">Specifications</h2>
                <table className="w-full text-sm">
                  <tbody>
                    {Object.entries(product.specs as Record<string, unknown>).map(([key, val]) => (
                      <tr key={key} className="border-b border-slate-100">
                        <td className="py-2 pr-4 text-slate-500 w-1/3">{key}</td>
                        <td className="py-2 text-slate-700 font-medium">{String(val)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <Separator />

            {/* CTA */}
            <div className="rounded-lg border bg-slate-50 p-5">
              <h3 className="mb-2 text-sm font-semibold text-slate-800">Interested in this product?</h3>
              <p className="mb-4 text-sm text-slate-500">Contact us for pricing, availability, and technical details.</p>
              <div className="flex flex-wrap gap-3">
                <Button asChild className="bg-slate-800 hover:bg-slate-700">
                  <a href="mailto:info@quickeaseliftparts.com">📧 Email Us</a>
                </Button>
                <Button variant="outline" asChild>
                  <a href="https://wa.me/8613335386941" target="_blank">💬 WhatsApp</a>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/contact">Contact Page</Link>
                </Button>
              </div>
            </div>
          </div>

          {/* ── Right: Inquiry Sidebar ── */}
          <aside className="space-y-5">
            {/* Contact info */}
            <div className="rounded-lg border bg-slate-50 p-6">
              <h3 className="mb-4 text-base font-bold text-slate-800">Send Message</h3>
              <div className="space-y-3 text-sm text-slate-600">
                <p>📧 <a href="mailto:info@quickeaseliftparts.com" className="text-blue-600 hover:underline">info@quickeaseliftparts.com</a></p>
                <p>📞 +86 13335386941</p>
                <p>💬 <a href="https://wa.me/8613335386941" target="_blank" className="text-green-600 hover:underline">Chat on WhatsApp</a></p>
              </div>
            </div>
            {/* Quick inquiry */}
            <ProductInquiryForm productSku={product.sku} productName={product.name} />
          </aside>
        </div>
      </section>

      {/* ── Bottom: Description + Documents ── */}
      <section className="border-t bg-slate-50 py-10">
        <div className="container mx-auto px-4">
          {product.description && (
            <div className="mb-8">
              <h2 className="mb-4 text-lg font-semibold text-slate-800">Product Details</h2>
              <div className="prose prose-sm max-w-none text-slate-600">
                <p>{product.description}</p>
              </div>
            </div>
          )}

          {product.documents && product.documents.length > 0 && (
            <div>
              <h2 className="mb-4 text-lg font-semibold text-slate-800">Documents</h2>
              <div className="flex flex-wrap gap-3">
                {product.documents.map((doc: any) => (
                  <a key={doc.id} href={doc.fileUrl} target="_blank" className="inline-flex items-center gap-2 rounded-md border bg-white px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">
                    📄 {doc.name}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── Related Products ── */}
      {relatedProducts.length > 0 && (
        <section className="py-12">
          <div className="container mx-auto px-4">
            <h2 className="mb-6 text-xl font-bold text-slate-800">Related Products</h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {relatedProducts.map((p) => (
                <Link key={p.sku} href={`/products/${p.sku}`}>
                  <div className="rounded-lg border bg-white p-3 text-center shadow-sm transition-all hover:shadow-md hover:-translate-y-1">
                    <div className="mb-2 flex aspect-square items-center justify-center overflow-hidden rounded bg-slate-50">
                      {Array.isArray(p.images) && p.images[0] ? (
                        <img src={p.images[0] as string} alt={p.name} className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-3xl text-slate-300">🔧</span>
                      )}
                    </div>
                    <p className="line-clamp-2 text-sm font-medium text-slate-700">{p.name}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Hot Products ── */}
      {hotProducts.length > 0 && (
        <section className="border-t bg-slate-50 py-12">
          <div className="container mx-auto px-4">
            <h2 className="mb-6 text-xl font-bold text-slate-800">🔥 Hot Products</h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {hotProducts.map((p) => (
                <Link key={p.sku} href={`/products/${p.sku}`}>
                  <div className="rounded-lg border bg-white p-3 text-center shadow-sm transition-all hover:shadow-md hover:-translate-y-1">
                    <div className="mb-2 flex aspect-square items-center justify-center overflow-hidden rounded bg-slate-50">
                      {Array.isArray(p.images) && p.images[0] ? (
                        <img src={p.images[0] as string} alt={p.name} className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-3xl text-slate-300">🔧</span>
                      )}
                    </div>
                    <p className="line-clamp-2 text-sm font-medium text-slate-700">{p.name}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
