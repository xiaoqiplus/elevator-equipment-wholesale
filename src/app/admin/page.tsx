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

  // 询盘统计：独立 try —— ContactMessage 表异常不能把整个概览页拖挂
  let msgTotal = 0;
  let msg7 = 0;
  let recentMessages: Array<{
    id: string;
    name: string;
    email: string;
    message: string;
    createdAt: Date;
  }> = [];
  try {
    const since7 = new Date(Date.now() - 7 * 24 * 3600 * 1000);
    [msgTotal, msg7, recentMessages] = await Promise.all([
      prisma.contactMessage.count(),
      prisma.contactMessage.count({ where: { createdAt: { gte: since7 } } }),
      prisma.contactMessage.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        select: { id: true, name: true, email: true, message: true, createdAt: true },
      }),
    ]);
  } catch {
    /* 表不存在/查询失败时，概览页其余部分照常显示 */
  }
  const smtpReady = Boolean(
    process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS
  );

  return (
    <div>
      <h1 className="text-lg font-semibold text-slate-800 mb-6">📊 概览</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
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
        <Link
          href="/admin/messages"
          className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 hover:border-primary-400 transition-colors"
        >
          <div className="text-xs font-medium text-slate-400 uppercase tracking-wide">询盘 · 最近 7 天</div>
          <div className={`text-3xl font-bold mt-1 ${msg7 > 0 ? "text-emerald-600" : "text-slate-900"}`}>
            {msg7}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            历史共 {msgTotal} 条{smtpReady ? "" : " · ⚠️ 邮件通知未配置"}
          </div>
        </Link>
      </div>

      {/* 最近询盘 —— 让"有没有新询盘"在概览页一眼可见 */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-slate-700">最近询盘</h2>
          <Link href="/admin/messages" className="text-xs text-primary-600 hover:text-primary-700">
            查看全部 →
          </Link>
        </div>
        {recentMessages.length === 0 ? (
          <p className="text-sm text-slate-400">还没有询盘消息。</p>
        ) : (
          <div className="space-y-3">
            {recentMessages.map((m) => {
              const isProduct = m.message.startsWith("[Inquiry about");
              const preview = m.message.replace(/^\[Inquiry about .+?\)\]\n?/, "").trim();
              return (
                <div key={m.id} className="flex items-start justify-between gap-4 border-b border-slate-100 pb-2 last:border-0 last:pb-0">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-slate-700">{m.name}</span>
                      <span
                        className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                          isProduct ? "bg-blue-50 text-blue-700" : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {isProduct ? "产品询价" : "留言"}
                      </span>
                      <span className="truncate text-xs text-slate-400">{m.email}</span>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-slate-500">{preview || "（空）"}</p>
                  </div>
                  <span className="shrink-0 text-xs text-slate-400">
                    {new Intl.DateTimeFormat("zh-CN", {
                      timeZone: "Asia/Shanghai",
                      month: "2-digit",
                      day: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: false,
                    }).format(m.createdAt)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
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
