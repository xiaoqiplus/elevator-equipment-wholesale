// 首页 — 仿 genting 风格
import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight } from "lucide-react";
import HeroCarousel from "@/components/HeroCarousel";

export const metadata: Metadata = { title: "QuickEasy Lift Parts - Elevator Parts Supplier" };

const HOT_SKUS = ["EL-SIE-001", "EL-SIE-002", "LFT-OTI-001", "LFT-OTI-002", "LFT-OTI-004", "EL-SIE-005"];

export default async function Home() {
  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });
  const hotProducts: any[] = [];
  for (const sku of HOT_SKUS) {
    const p = await prisma.product.findUnique({ where: { sku }, include: { category: true, brand: true } });
    if (p) hotProducts.push(p);
  }

  return (
    <div>
      {/* ── Hero Carousel ── */}
      <HeroCarousel />

      {/* ── Why Choose Us ── */}
      <section className="py-20" data-aos="fade-up">
        <div className="container mx-auto px-4">
          <h2 className="mb-2 text-center text-2xl font-bold text-slate-800">Why Customers Choose Us</h2>
          <p className="mb-12 text-center text-sm text-slate-400">What Makes QuickEasy Lift Parts Different</p>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: "🚚", title: "Fast Delivery", desc: "Quick dispatch and reliable shipping worldwide. Most orders ship within 24 hours." },
              { icon: "✅", title: "Quality Guaranteed", desc: "All parts sourced from certified manufacturers. Strict quality control at every step." },
              { icon: "🎧", title: "Expert Support", desc: "Technical team with decades of elevator industry experience." },
              { icon: "🏢", title: "Complete Inventory", desc: "Extensive stock of elevator parts for all major brands — Otis, Kone, Schindler, Mitsubishi & more." },
            ].map((item, i) => (
              <Card key={i} className="border-0 bg-slate-50 p-6 text-center shadow-sm">
                <div className="mb-4 text-4xl">{item.icon}</div>
                <h3 className="mb-2 font-semibold text-slate-800">{item.title}</h3>
                <p className="text-sm text-slate-500">{item.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── Hot Products ── */}
      <section className="bg-slate-50 py-20" data-aos="fade-up">
        <div className="container mx-auto px-4">
          <div className="mb-12 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-800">Hot Products</h2>
              <p className="text-sm text-slate-400">Most Popular Elevator Parts</p>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/products">View All <ArrowRight className="ml-1 h-4 w-4" /></Link>
            </Button>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {hotProducts.map((p) => (
              <Link key={p.sku} href={`/products/${p.sku}`}>
                <Card className="h-full overflow-hidden transition-all hover:shadow-md hover:-translate-y-1">
                  <div className="flex aspect-square items-center justify-center bg-white text-5xl text-slate-200">🔧</div>
                  <CardContent className="p-5">
                    <Badge variant="secondary" className="mb-2 font-mono text-xs">{p.sku}</Badge>
                    <h3 className="mb-1 font-semibold text-slate-800 line-clamp-2">{p.name}</h3>
                    {p.description && <p className="mb-3 text-xs text-slate-500 line-clamp-2">{p.description}</p>}
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      {p.category && <span>{p.category.name}</span>}
                      {p.brand && <span>{p.brand.name}</span>}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Product Categories ── */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="mb-2 text-center text-2xl font-bold text-slate-800">Product Categories</h2>
          <p className="mb-12 text-center text-sm text-slate-400">Browse Our Full Range</p>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
            {categories.map((cat, i) => (
              <Link key={cat.id} href={`/categories/${cat.slug}`}>
                <Card className="h-full text-center transition-all hover:shadow-md hover:-translate-y-0.5">
                  <CardContent className="p-4">
                    <p className="text-sm font-medium text-slate-700">{cat.name}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Contact CTA ── */}
      <section className="bg-slate-900 py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="mb-3 text-2xl font-bold text-white">Need Elevator Parts?</h2>
          <p className="mb-8 text-slate-300">Contact us for inquiries, quotes, or technical support</p>
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
            <a href="mailto:info@quickeasyliftparts.com" className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors">📧 info@quickeasyliftparts.com</a>
            <span className="hidden text-slate-600 md:inline">|</span>
            <a href="tel:+86138xxxxxxx" className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors">📞 +86 138-xxxx-xxxx</a>
            <span className="hidden text-slate-600 md:inline">|</span>
            <a href="https://wa.me/86138xxxxxxx" target="_blank" className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors">💬 WhatsApp</a>
          </div>
        </div>
      </section>
    </div>
  );
}
