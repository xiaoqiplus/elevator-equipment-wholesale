import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Package, Cable, Wrench, Gauge, Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const fallbackIcons = [Package, Cable, Wrench, Gauge, Shield];

export default async function Home() {
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
  });

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-slate-50 via-white to-slate-100 py-20 md:py-28">
        <div className="container mx-auto px-4 text-center">
          <p className="mb-2 text-sm uppercase tracking-widest text-slate-400">
            Quick Delivery · Easy Service · Zero Downtime
          </p>
          <h1 className="mb-4 text-3xl font-bold tracking-tight text-slate-800 md:text-5xl">
            QuickEasy Lift Parts
          </h1>
          <p className="mx-auto mb-6 max-w-2xl text-base text-slate-500 md:text-lg">
            专业电梯零部件供应商，为您提供高品质的门系统、控制系统、曳引系统、线缆线束、安全部件等全系列电梯配件。
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link
              href="/products"
              className="rounded-lg bg-slate-800 px-6 py-2.5 text-sm font-medium text-white hover:bg-slate-700 transition-colors"
            >
              浏览产品
            </Link>
            <Link
              href="/contact"
              className="rounded-lg border border-slate-200 px-6 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              联系我们
            </Link>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="mb-2 text-center text-2xl font-bold text-slate-800">产品分类</h2>
          <p className="mb-10 text-center text-sm text-slate-400">
            覆盖电梯各大系统零部件
          </p>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
            {categories.map((cat, i) => {
              const Icon = fallbackIcons[i % fallbackIcons.length];
              return (
                <Link key={cat.id} href={`/categories/${cat.slug}`}>
                  <Card className="h-full transition-all hover:shadow-md hover:-translate-y-0.5">
                    <CardHeader className="pb-2 pt-4">
                      <Icon className="mx-auto h-8 w-8 text-slate-400" />
                    </CardHeader>
                    <CardContent className="pb-4 pt-0 text-center">
                      <CardTitle className="text-sm font-medium text-slate-700">{cat.name}</CardTitle>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="bg-slate-800 py-14">
        <div className="container mx-auto px-4 text-center">
          <h2 className="mb-3 text-xl font-bold text-white md:text-2xl">
            需要电梯配件？
          </h2>
          <p className="mb-6 text-sm text-slate-300">
            欢迎随时联系我们获取产品信息和报价
          </p>
          <div className="flex flex-col items-center gap-2 text-sm text-slate-300">
            <p>📞 电话：138-xxxx-xxxx</p>
            <p>💬 微信：xx-elevator-parts</p>
            <p>📧 邮箱：info@xx-elevator.com</p>
          </div>
        </div>
      </section>
    </div>
  );
}
