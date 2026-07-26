"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface Article {
  id: string;
  title: string;
  url: string;
  date: string;
  images: string | null;
  summary: string | null;
}

export default function KnowledgeListPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  const load = (p: number, query: string) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(p), limit: "50" });
    if (query) params.set("q", query);
    fetch(`/api/admin/knowledge?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setArticles(data.articles || []);
        setTotal(data.total || 0);
        setPage(data.page || 1);
        setTotalPages(data.totalPages || 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load(1, q);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    load(1, q);
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`确定删除「${title}」？`)) return;
    const res = await fetch(`/api/admin/knowledge?id=${id}`, { method: "DELETE" });
    if (res.ok) load(page, q);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-semibold text-slate-800">📚 知识管理</h1>
        <Link
          href="/admin/knowledge/new"
          className="px-4 py-2 text-sm font-medium text-white bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors"
        >
          + 新增文章
        </Link>
      </div>

      {/* 搜索 */}
      <form onSubmit={handleSearch} className="mb-4 flex gap-2">
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="搜索文章标题..."
          className="flex-1 px-3 py-2 text-sm rounded-lg border border-slate-300 focus:border-slate-500 outline-none"
        />
        <button
          type="submit"
          className="px-4 py-2 text-sm rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-300"
        >
          搜索
        </button>
      </form>

      {loading ? (
        <div className="text-center py-12 text-sm text-slate-400">加载中...</div>
      ) : articles.length === 0 ? (
        <div className="text-center py-12 text-sm text-slate-400">暂无文章</div>
      ) : (
        <>
          <div className="text-xs text-slate-400 mb-3">共 {total} 篇</div>
          <div className="space-y-2">
            {articles.map((a) => (
              <div
                key={a.id}
                className="flex items-center justify-between bg-white rounded-lg border border-slate-200 px-4 py-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-800 truncate">
                    {a.title}
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    {a.date?.slice(0, 10) || "-"}
                    {a.summary && ` · ${a.summary.slice(0, 60)}...`}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-4">
                  <Link
                    href={`/admin/knowledge/${a.id}/edit`}
                    className="px-3 py-1.5 text-xs rounded-md bg-slate-100 text-slate-600 hover:bg-slate-200"
                  >
                    编辑
                  </Link>
                  <button
                    onClick={() => handleDelete(a.id, a.title)}
                    className="px-3 py-1.5 text-xs rounded-md bg-red-50 text-red-500 hover:bg-red-100"
                  >
                    删除
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* 分页 */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <button
                disabled={page <= 1}
                onClick={() => load(page - 1, q)}
                className="px-3 py-1.5 text-xs rounded-md bg-slate-100 text-slate-600 disabled:opacity-30"
              >
                上一页
              </button>
              <span className="text-xs text-slate-400">
                {page} / {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => load(page + 1, q)}
                className="px-3 py-1.5 text-xs rounded-md bg-slate-100 text-slate-600 disabled:opacity-30"
              >
                下一页
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
