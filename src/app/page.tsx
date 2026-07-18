// 首页 — 仿 genting 风格
import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight } from "lucide-react";
import HeroCarousel from "@/components/HeroCarousel";

export const metadata: Metadata = { title: "QuickEase Lift Parts - Elevator Parts Supplier" };

const HOT_SKUS = [
  "ESCALATORHANDRAILBELTDISASSEMB",
  "ESCALATORSAFETYBRUSHHEAD506590",
  "THYSSENKRUPPESCALATORRADAR3800",
  "ELESICKESCALATORSENSOREQ50LU50",
  "HONEYWELLESCALATORSWITCHZLDXC0",
  "CONTRINEXESCALATORSWITCHND40SB",
  "SCHINDLERESCALATORMOTORCOUPLIN",
  "SJECESCALATORHANDRAILGUIDESLID",
  "XIZIOTISESCALATORGUIDESLIDEXAA",
];

export default async function Home() {
  const categories = await prisma.category.findMany({
    include: { products: { take: 1, select: { images: true }, orderBy: { name: "asc" } } },
    orderBy: { name: "asc" },
  });
  const hotProducts: any[] = [];
  for (const sku of HOT_SKUS) {
    const p = await prisma.product.findUnique({ where: { sku }, include: { category: true, brand: true } });
    if (p) hotProducts.push(p);
  }
  const knowledgeArticles = await prisma.knowledge.findMany({ orderBy: { createdAt: "desc" }, take: 4 });

  return (
    <div>
      {/* ── Hero Carousel ── */}
      <HeroCarousel />

      {/* ── Why Choose Us ── */}
      <section className="py-20" data-aos="fade-up">
        <div className="container mx-auto px-4">
          <h4 className="mb-2 text-center text-2xl font-bold text-slate-800">Why Customers Choose Us</h4>
          <p className="mb-14 text-center text-sm text-slate-400">What Makes QuickEase Lift Parts Different</p>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {[
              { title: "Strong Team", icon: "🚚", desc: "Years of experience in elevator industry. Professional team with deep technical knowledge." },
              { title: "Complete Category", icon: "✅", desc: "Select and gather multiple quality suppliers. Various elevator parts for all major brands." },
              { title: "Timely Delivery", icon: "📦", desc: "A large number of commonly used accessories are stocked. Quick dispatch worldwide." },
              { title: "Worry Free After Sale", icon: "🎧", desc: "Can provide technical support and product return services. We're here to help." },
            ].map((item, i) => (
              <div key={i} className="choose-item text-center">
                <div className="mb-2 text-sm font-semibold text-slate-700">{item.title}</div>
                <div className="mb-4 text-5xl">{item.icon}</div>
                <div className="text-sm text-slate-500 leading-relaxed">{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── About Company ── */}
      <section className="py-20" data-aos="fade-up">
        <div className="container mx-auto px-4">
          <div className="grid items-center gap-10 md:grid-cols-2">
            <div className="space-y-4">
              <h4 className="text-2xl font-bold text-slate-800">XI'AN QUICKEASE LIFT PARTS CO., Ltd</h4>
              <p className="text-sm text-slate-500 leading-relaxed">
                XI'AN QUICKEASE LIFT PARTS CO., Ltd, located in Shaanxi, China, is a professional elevator parts supplier. 
                We specialize in providing high-quality elevator components for all major brands including 
                Otis, Kone, Schindler, Mitsubishi, ThyssenKrupp, and more.
              </p>
              <p className="text-sm text-slate-500 leading-relaxed">
                With extensive industry experience and a comprehensive inventory, we serve elevator 
                maintenance companies, contractors, and manufacturers worldwide.
              </p>
              <Button asChild>
                <Link href="/about">Read More <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
            </div>
            <div className="flex items-center justify-center">
              <img
                src="/uploads/company.jpg"
                alt="XI'AN QUICKEASE LIFT PARTS CO., Ltd"
                className="h-64 w-full rounded-lg object-cover shadow-sm"
              />
            </div>
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
                  <div className="aspect-square bg-slate-50 flex items-center justify-center overflow-hidden">
                    {Array.isArray(p.images) && p.images[0] ? (
                      <img src={p.images[0] as string} alt={p.name} className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-5xl text-slate-200">🔧</span>
                    )}
                  </div>
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
                <Card className="h-full overflow-hidden transition-all hover:shadow-md hover:-translate-y-0.5">
                  <div className="aspect-video bg-slate-100 overflow-hidden">
                    {Array.isArray(cat.products[0]?.images) && cat.products[0].images[0] ? (
                      <img src={cat.products[0].images[0] as string} alt={cat.name}
                        className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-2xl text-slate-300">📦</div>
                    )}
                  </div>
                  <CardContent className="p-3 text-center">
                    <p className="text-sm font-medium text-slate-700">{cat.name}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Top Brands ── */}
      <section className="py-16" data-aos="fade-up">
        <div className="container mx-auto px-4 text-center">
          <h4 className="mb-2 text-2xl font-bold text-slate-800">Top Brands</h4>
          <p className="mb-10 text-sm text-slate-400">Elevator Parts for All Major Manufacturers</p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            {[
              { name: "Mitsubishi", slug: "mitsubishi", count: 137 },
              { name: "KONE", slug: "kone", count: 121 },
              { name: "Otis", slug: "otis", count: 85 },
              { name: "TKE", slug: "tke", count: 36 },
              { name: "XIZI OTIS", slug: "xizi-otis", count: 31 },
              { name: "Monarch", slug: "monarch", count: 29 },
              { name: "HITACHI", slug: "hitachi", count: 22 },
              { name: "Hyundai", slug: "hyundai", count: 19 },
              { name: "ThyssenKrupp", slug: "thyssenkrupp", count: 19 },
              { name: "SIGMA", slug: "sigma", count: 16 },
              { name: "Fujitec", slug: "fujitec", count: 15 },
              { name: "Toshiba", slug: "toshiba", count: 12 },
            ].map((brand) => (
              <Link key={brand.slug} href={`/brands/${brand.slug}`}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700 shadow-sm transition-all hover:border-slate-400 hover:shadow-md hover:-translate-y-0.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">
                  {brand.name[0]}
                </span>
                <span>{brand.name}</span>
                <span className="text-xs text-slate-400">({brand.count})</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Knowledge / Blog ── */}
      <section className="bg-slate-50 py-20" data-aos="fade-up">
        <div className="container mx-auto px-4">
          <div className="mb-12 flex items-center justify-between">
            <div>
              <h4 className="text-2xl font-bold text-slate-800">What&apos;s Going on in Our Blog?</h4>
              <p className="text-sm text-slate-400">Knowledges</p>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/knowledge">View All <ArrowRight className="ml-1 h-4 w-4" /></Link>
            </Button>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {knowledgeArticles.map((post) => (
              <Link key={post.id} href={`/knowledge/${post.id}`} className="group">
                <div className="mb-3 aspect-video rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden">
                  {post.images ? (
                    <img src={post.images.split(",")[0]} alt={post.title}
                      className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-2xl text-slate-300">📋</span>
                  )}
                </div>
                <p className="mb-1 text-xs text-slate-400">{new Date(post.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
                <h3 className="mb-1 text-sm font-semibold text-slate-800 line-clamp-2 group-hover:text-slate-600 transition-colors">{post.title}</h3>
                <p className="text-xs text-slate-500 line-clamp-2">{post.summary || post.content?.slice(0, 150)}</p>
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
            <a href="mailto:info@quickeaseliftparts.com" className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors">📧 info@quickeaseliftparts.com</a>
            <span className="hidden text-slate-600 md:inline">|</span>
            <a href="tel:+8613335386941" className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors">📞 +86 13335386941</a>
            <span className="hidden text-slate-600 md:inline">|</span>
            <a href="https://wa.me/8613335386941" target="_blank" className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors">💬 WhatsApp</a>
          </div>
        </div>
      </section>
    </div>
  );
}
