import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 30;

// message 里如果是产品页来的询价，前端会拼前缀：[Inquiry about 产品名 (SKU: XXX)]
function parseInquiry(message: string) {
  const m = message.match(/^\[Inquiry about (.+?) \(SKU: (.+?)\)\]\n?/);
  if (m) {
    return {
      isProduct: true,
      productName: m[1],
      sku: m[2],
      body: message.slice(m[0].length).trim(),
    };
  }
  return { isProduct: false, productName: null as string | null, sku: null as string | null, body: message.trim() };
}

// 统一按北京时间显示（Hostinger 服务器是 UTC）
function fmtTime(d: Date): string {
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
}

export default async function AdminMessagesPage({
  searchParams,
}: {
  searchParams: { page?: string };
}) {
  const page = Math.max(1, parseInt(searchParams?.page || "1", 10) || 1);

  const now = Date.now();
  const since7 = new Date(now - 7 * 24 * 3600 * 1000);
  const since30 = new Date(now - 30 * 24 * 3600 * 1000);

  let total = 0;
  let last7 = 0;
  let last30 = 0;
  let productInquiries = 0;
  let items: Array<{
    id: string;
    name: string;
    email: string;
    phone: string | null;
    message: string;
    createdAt: Date;
  }> = [];
  let dbError: string | null = null;

  try {
    [total, last7, last30, productInquiries, items] = await Promise.all([
      prisma.contactMessage.count(),
      prisma.contactMessage.count({ where: { createdAt: { gte: since7 } } }),
      prisma.contactMessage.count({ where: { createdAt: { gte: since30 } } }),
      prisma.contactMessage.count({ where: { message: { startsWith: "[Inquiry about" } } }),
      prisma.contactMessage.findMany({
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        select: { id: true, name: true, email: true, phone: true, message: true, createdAt: true },
      }),
    ]);
  } catch (e) {
    dbError = e instanceof Error ? e.message : String(e);
  }

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // 邮件通道是"尽力而为"，失败只写服务器日志 —— 所以这里明确显示它到底配没配
  const smtpReady = Boolean(
    process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS
  );
  const notifyTo = process.env.NOTIFY_EMAIL || "(未设置 NOTIFY_EMAIL)";

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-slate-800">📨 询盘消息</h1>
        <span className="text-xs text-slate-400">数据源：ContactMessage 表 · 按时间倒序</span>
      </div>

      {dbError && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          读取数据库失败：{dbError}
        </div>
      )}

      {/* 统计 */}
      <div className="mb-4 grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-xs font-medium uppercase tracking-wide text-slate-400">总计</div>
          <div className="mt-1 text-3xl font-bold text-slate-900">{total}</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-xs font-medium uppercase tracking-wide text-slate-400">最近 7 天</div>
          <div className={`mt-1 text-3xl font-bold ${last7 > 0 ? "text-emerald-600" : "text-slate-900"}`}>
            {last7}
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-xs font-medium uppercase tracking-wide text-slate-400">最近 30 天</div>
          <div className="mt-1 text-3xl font-bold text-slate-900">{last30}</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-xs font-medium uppercase tracking-wide text-slate-400">产品询价</div>
          <div className="mt-1 text-3xl font-bold text-slate-900">{productInquiries}</div>
          <div className="mt-1 text-[11px] text-slate-400">其余为联系页留言</div>
        </div>
      </div>

      {/* 邮件通道状态 —— 不配也能看，但必须一眼知道 */}
      <div
        className={`mb-6 rounded-lg border p-4 text-sm ${
          smtpReady
            ? "border-emerald-200 bg-emerald-50 text-emerald-800"
            : "border-red-200 bg-red-50 text-red-700"
        }`}
      >
        {smtpReady ? (
          <>
            ✅ 邮件通知已配置，新询盘会发到 <span className="font-mono">{notifyTo}</span>。
            这个页面是第二道保险 —— 建议每周看一眼，防邮件进垃圾箱。
          </>
        ) : (
          <>
            ⚠️ <b>邮件通知未启用</b>（SMTP_HOST / SMTP_USER / SMTP_PASS 有缺失）——
            新询盘只会存在数据库里，<b>不会有任何邮件提醒</b>。
            请到 Hostinger 面板补齐这三个环境变量，否则必须靠这个页面人工巡查。
          </>
        )}
      </div>

      {/* 列表 */}
      {items.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-400">
          {total === 0 ? "还没有任何询盘消息。" : "这一页没有数据，返回第一页看看。"}
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((it) => {
            const p = parseInquiry(it.message);
            return (
              <div key={it.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1">
                  <span className="text-sm font-semibold text-slate-800">{it.name}</span>
                  <a href={`mailto:${it.email}`} className="text-xs text-primary-600 hover:underline">
                    ✉️ {it.email}
                  </a>
                  {it.phone && (
                    <a href={`tel:${it.phone}`} className="text-xs text-slate-600 hover:underline">
                      📞 {it.phone}
                    </a>
                  )}
                  {p.isProduct ? (
                    <span className="rounded bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700">
                      产品询价
                    </span>
                  ) : (
                    <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                      联系留言
                    </span>
                  )}
                  <span className="ml-auto text-xs text-slate-400">{fmtTime(it.createdAt)}</span>
                </div>

                {p.isProduct && (
                  <div className="mb-2 text-xs text-slate-500">
                    询价产品：
                    <Link
                      href={`/products/${p.sku}`}
                      target="_blank"
                      className="font-medium text-slate-700 hover:underline"
                    >
                      {p.productName}
                    </Link>
                    <span className="ml-2 font-mono text-slate-400">{p.sku}</span>
                  </div>
                )}

                <div className="whitespace-pre-line rounded-lg bg-slate-50 p-3 text-sm leading-relaxed text-slate-700">
                  {p.body || "（空）"}
                </div>

                <div className="mt-3 flex gap-3 text-xs">
                  <a
                    href={`mailto:${it.email}?subject=${encodeURIComponent(
                      p.isProduct ? `Re: Your inquiry about ${p.productName} (${p.sku})` : "Re: Your message to QuickEase Lift Parts"
                    )}`}
                    className="rounded border border-slate-300 px-3 py-1.5 font-medium text-slate-700 hover:bg-slate-50"
                  >
                    回复邮件
                  </a>
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(
                      `Hello ${it.name}, this is QuickEase Lift Parts. Thanks for your inquiry` +
                        (p.isProduct ? ` about ${p.productName} (${p.sku})` : "") +
                        `. Could you share the quantity and your destination port?`
                    )}`}
                    target="_blank"
                    className="rounded border border-slate-300 px-3 py-1.5 font-medium text-slate-700 hover:bg-slate-50"
                  >
                    用 WhatsApp 跟进
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 分页 */}
      {pages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-3 text-sm">
          {page > 1 ? (
            <Link
              href={`/admin/messages?page=${page - 1}`}
              className="rounded border border-slate-300 px-4 py-2 text-slate-700 hover:bg-slate-50"
            >
              ← 上一页
            </Link>
          ) : (
            <span className="rounded border border-slate-200 px-4 py-2 text-slate-300">← 上一页</span>
          )}
          <span className="text-slate-500">
            第 {page} / {pages} 页（共 {total} 条）
          </span>
          {page < pages ? (
            <Link
              href={`/admin/messages?page=${page + 1}`}
              className="rounded border border-slate-300 px-4 py-2 text-slate-700 hover:bg-slate-50"
            >
              下一页 →
            </Link>
          ) : (
            <span className="rounded border border-slate-200 px-4 py-2 text-slate-300">下一页 →</span>
          )}
        </div>
      )}
    </div>
  );
}
