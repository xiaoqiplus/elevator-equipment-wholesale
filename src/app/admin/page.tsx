import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  const [productCount, categoryCount, brandCount, recentProducts] = await Promise.all([
    prisma.product.count(),
    prisma.category.count(),
    prisma.brand.count(),
    prisma.product.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: { sku: true, name: true, createdAt: true },
    }),
  ]);

  return (
    <div>
      <h1 className="text-lg font-semibold text-slate-800 mb-6">📊 概览</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <div className="text-xs font-medium text-slate-400 uppercase tracking-wide">产品总数</div>
          <div className="text-3xl font-bold text-slate-900 mt-1">{productCount}</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <div className="text-xs font-medium text-slate-400 uppercase tracking-wide">分类</div>
          <div className="text-3xl font-bold text-slate-900 mt-1">{categoryCount}</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <div className="text-xs font-medium text-slate-400 uppercase tracking-wide">品牌</div>
          <div className="text-3xl font-bold text-slate-900 mt-1">{brandCount}</div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-slate-700">最近添加的产品</h2>
          <Link href="/admin/products" className="text-xs text-primary-600 hover:text-primary-700">
            查看全部 →
          </Link>
        </div>
        <div className="space-y-2">
          {recentProducts.map((p) => (
            <div key={p.sku} className="flex items-center justify-between text-sm">
              <Link href={`/admin/products/${p.sku}/edit`} className="text-slate-700 hover:text-primary-600">
                {p.name}
              </Link>
              <span className="text-xs text-slate-400">{p.sku}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
