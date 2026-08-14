"use client";

import { useCallback, useEffect, useState } from "react";

interface VisitItem {
  ip: string;
  country: string | null;
  path: string;
  userAgent: string | null;
  firstSeen: string;
  lastSeen: string;
  visitCount: number;
}

interface CountryStat {
  country: string | null;
  visits: number;
  ips: number;
}

interface VisitsData {
  total: number;
  totalVisits: number;
  page: number;
  limit: number;
  pages: number;
  items: VisitItem[];
  countries: CountryStat[];
}

const RANGE_OPTIONS = [
  { value: "0", label: "全部时间" },
  { value: "24", label: "最近 24 小时" },
  { value: "168", label: "最近 7 天" },
  { value: "720", label: "最近 30 天" },
];

function flagEmoji(code?: string | null): string {
  if (!code) return "🌐";
  const c = code.toUpperCase();
  if (!/^[A-Z]{2}$/.test(c)) return "🌐";
  return c.replace(/./g, (ch: string) => String.fromCodePoint(127397 + ch.charCodeAt(0)));
}

function countryName(code?: string | null): string {
  if (!code) return "未知";
  try {
    return new Intl.DisplayNames(["zh"], { type: "region" }).of(code.toUpperCase()) || code;
  } catch {
    return code;
  }
}

function isBot(ua?: string | null): boolean {
  if (!ua) return false;
  return /bot|crawl|spider|slurp|bingbot|googlebot|baiduspider|yandex|facebookexternalhit|preview|monitoring|uptime/i.test(ua);
}

function fmtTime(d: string | Date): string {
  const date = new Date(d);
  const now = Date.now();
  const diff = now - date.getTime();
  if (diff < 60 * 1000) return "刚刚";
  if (diff < 3600 * 1000) return `${Math.floor(diff / 60000)} 分钟前`;
  return date.toLocaleString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminVisitsPage() {
  const [data, setData] = useState<VisitsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [country, setCountry] = useState("");
  const [range, setRange] = useState("0");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ page: String(page), limit: "50" });
      if (country) params.set("country", country);
      if (range !== "0") params.set("range", range);
      if (q.trim()) params.set("q", q.trim());
      const res = await fetch(`/api/admin/visits?${params.toString()}`);
      if (res.status === 401) {
        window.location.href = "/admin/login";
        return;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json);
      setLastRefresh(new Date());
    } catch (e) {
      setError(e instanceof Error ? e.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }, [page, country, range, q]);

  useEffect(() => {
    load();
  }, [load]);

  const maxCountryVisits = data?.countries.length ? Math.max(...data.countries.map((c) => c.visits), 1) : 1;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">🌐 访问统计</h1>
          <p className="text-sm text-slate-500 mt-1">
            访问者 IP 归属地（精确到国家），每 IP 一行累计访问次数
            {lastRefresh && <span className="ml-2 text-slate-400">更新于 {lastRefresh.toLocaleTimeString("zh-CN")}</span>}
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="px-4 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
        >
          {loading ? "加载中..." : "🔄 刷新"}
        </button>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="text-sm text-slate-500">独立 IP 数</div>
          <div className="text-3xl font-bold text-slate-800 mt-1">{data?.total ?? "—"}</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="text-sm text-slate-500">总页面访问量</div>
          <div className="text-3xl font-bold text-primary-600 mt-1">{data?.totalVisits ?? "—"}</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="text-sm text-slate-500">覆盖国家/地区</div>
          <div className="text-3xl font-bold text-slate-800 mt-1">{data?.countries.length ?? "—"}</div>
        </div>
      </div>

      {/* 筛选栏 */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-wrap items-center gap-3">
        <select
          value={country}
          onChange={(e) => {
            setCountry(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="">🌍 全部国家</option>
          {data?.countries.map((c) => (
            <option key={c.country ?? "unknown"} value={c.country ?? ""}>
              {flagEmoji(c.country)} {countryName(c.country)}（{c.visits}）
            </option>
          ))}
        </select>
        <select
          value={range}
          onChange={(e) => {
            setRange(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          {RANGE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <div className="flex items-center gap-2 flex-1 min-w-[220px]">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                setPage(1);
                load();
              }
            }}
            placeholder="搜索 IP（回车确认）"
            className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <button
            onClick={() => {
              setPage(1);
              load();
            }}
            className="px-4 py-2 bg-slate-800 text-white text-sm rounded-lg hover:bg-slate-700 transition-colors"
          >
            搜索
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
          加载失败：{error}
        </div>
      )}

      {loading && !data ? (
        <div className="bg-white rounded-xl border border-slate-200 p-10 text-center text-slate-400 text-sm">
          加载中...
        </div>
      ) : data && data.items.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-10 text-center text-slate-400 text-sm">
          暂无访问记录。部署后访问前台页面即可开始统计。
        </div>
      ) : data ? (
        <>
          {/* 国家分布 */}
          {data.countries.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h2 className="text-sm font-semibold text-slate-700 mb-4">🌍 国家/地区分布</h2>
              <div className="space-y-2.5">
                {data.countries.slice(0, 15).map((c) => (
                  <div key={c.country ?? "unknown"} className="flex items-center gap-3">
                    <div className="w-40 shrink-0 flex items-center gap-1.5 text-sm text-slate-700 truncate">
                      <span>{flagEmoji(c.country)}</span>
                      <span className="truncate">{countryName(c.country)}</span>
                    </div>
                    <div className="flex-1 h-4 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary-500 to-primary-400 rounded-full transition-all"
                        style={{ width: `${Math.max(2, (c.visits / maxCountryVisits) * 100)}%` }}
                      />
                    </div>
                    <div className="w-16 shrink-0 text-right text-sm text-slate-600 tabular-nums">
                      {c.visits}
                      <span className="text-slate-400 text-xs"> 次</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* IP 明细表 */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-700">📍 IP 明细</h2>
              <span className="text-xs text-slate-400">
                共 {data.total} 个 IP · 第 {data.page}/{data.pages} 页
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-slate-500 border-b border-slate-100 bg-slate-50">
                    <th className="px-5 py-3 font-medium">IP 地址</th>
                    <th className="px-3 py-3 font-medium">归属地</th>
                    <th className="px-3 py-3 font-medium text-right">访问次数</th>
                    <th className="px-3 py-3 font-medium">最后访问</th>
                    <th className="px-3 py-3 font-medium">最近页面</th>
                    <th className="px-5 py-3 font-medium">浏览器/爬虫</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((v) => {
                    const bot = isBot(v.userAgent);
                    return (
                      <tr key={v.ip} className="border-b border-slate-50 hover:bg-slate-50/60">
                        <td className="px-5 py-3 font-mono text-xs text-slate-700">
                          {v.ip}
                          {bot && <span className="ml-2 text-xs" title="可能是爬虫/机器人">🤖</span>}
                        </td>
                        <td className="px-3 py-3">
                          <span className="inline-flex items-center gap-1.5">
                            <span>{flagEmoji(v.country)}</span>
                            <span className="text-slate-700">{countryName(v.country)}</span>
                            {v.country && (
                              <span className="text-[10px] text-slate-400 uppercase">{v.country}</span>
                            )}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-right tabular-nums text-slate-700">{v.visitCount}</td>
                        <td className="px-3 py-3 text-xs text-slate-500 whitespace-nowrap">{fmtTime(v.lastSeen)}</td>
                        <td className="px-3 py-3 text-xs text-slate-500 max-w-[200px] truncate">{v.path}</td>
                        <td className="px-5 py-3 text-xs text-slate-400 max-w-[240px] truncate" title={v.userAgent ?? ""}>
                          {v.userAgent?.slice(0, 60) || "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {/* 分页 */}
            {data.pages > 1 && (
              <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="px-3 py-1.5 text-sm text-slate-600 border border-slate-300 rounded-lg disabled:opacity-40 hover:bg-slate-50 transition-colors"
                >
                  ← 上一页
                </button>
                <span className="text-xs text-slate-400">
                  第 {data.page} / {data.pages} 页
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(data.pages, p + 1))}
                  disabled={page >= data.pages}
                  className="px-3 py-1.5 text-sm text-slate-600 border border-slate-300 rounded-lg disabled:opacity-40 hover:bg-slate-50 transition-colors"
                >
                  下一页 →
                </button>
              </div>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}
