import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { Metadata } from "next";

interface Props { params: { sku: string } }

async function getProduct(sku: string) {
  return prisma.product.findUnique({
    where: { sku },
    include: { category: true, brand: true, documents: true },
  });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await getProduct(params.sku);
  if (!product) return { title: "Product Not Found" };
  return { title: product.name, description: product.description || `Elevator component ${product.sku}` };
}

export default async function ProductDetailPage({ params }: Props) {
  const { sku } = params;
  if (!sku) notFound();

  let product: any = null;
  try { product = await getProduct(sku); } catch { /* ignore */ }
  if (!product) notFound();

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
        <div className="grid gap-10 lg:grid-cols-2">
          {/* ── Left: Images ── */}
          <div>
            <div className="mb-4 overflow-hidden rounded-lg border bg-slate-100">
              {product.images && product.images[0] ? (
                <img src={product.images[0]} alt={product.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex aspect-square items-center justify-center text-slate-300 text-6xl">🔧</div>
              )}
            </div>
            {product.images && product.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {product.images.map((img: string, i: number) => (
                  <div key={i} className="h-16 w-16 flex-shrink-0 overflow-hidden rounded border border-slate-200">
                    <img src={img} alt={`${product.name} ${i + 1}`} className="h-full w-full object-cover" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Right: Info ── */}
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

            {product.description && (
              <div>
                <h2 className="mb-2 text-base font-semibold text-slate-800">Description</h2>
                <p className="text-sm text-slate-600 leading-relaxed">{product.description}</p>
              </div>
            )}

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
                  <a href="mailto:info@quickeasyliftparts.com">📧 Email Us</a>
                </Button>
                <Button variant="outline" asChild>
                  <a href="https://wa.me/86138xxxxxxx" target="_blank">💬 WhatsApp</a>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/contact">Contact Page</Link>
                </Button>
              </div>
            </div>
          </div>
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
    </div>
  );
}
