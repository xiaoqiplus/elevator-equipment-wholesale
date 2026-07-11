"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Product {
  sku: string;
  name: string;
  images: string[];
  category: { name: string } | null;
  brand: { name: string } | null;
  createdAt: string;
}

export default function AdminProducts() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchProducts = async (p: number, q: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/products?page=${p}&limit=50&q=${encodeURIComponent(q)}`);
      if (res.status === 401) {
        router.push("/admin/login");
        return;
      }
      const data = await res.json();
      setProducts(data.products);
      setTotal(data.total);
      setPage(data.page);
      setTotalPages(data.totalPages);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts(1, "");
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProducts(1, search);
  };

  const handleDelete = async (sku: string, name: string) => {
    if (!confirm(`确定删除「${name}」(SKU: ${sku})？此操作不可恢复。`)) return;
    const res = await fetch(`/api/admin/products?sku=${sku}`, { method: "DELETE" });
    if (res.ok) {
      fetchProducts(page, search);
    } else {
      alert("删除失败");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-semibold text-slate-800">📦 产品管理</h1>
        <Link
          href="/admin/products/new"
          className="px-4 py-2 text-sm font-medium text-white bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors"
        >
          + 新增产品
        </Link>
      </div>

      {/* 搜索 */}
      <form onSubmit={handleSearch} className="mb-6 flex gap-2">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="搜索产品名称或SKU..."
          className="flex-1 px-3 py-2 text-sm rounded-lg border border-slate-300 focus:border-slate-500 outline-none"
        />
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium text-white bg-slate-700 rounded-lg hover:bg-slate-600"
        >
          搜索
        </button>
        {search && (
          <button
            type="button"
            onClick={() => { setSearch(""); fetchProducts(1, ""); }}
            className="px-3 py-2 text-sm text-slate-500 hover:text-slate-700"
          >
            清除
          </button>
        )}
      </form>

      {/* 统计 */}
      <p className="text-xs text-slate-400 mb-4">
        共 {total} 个产品
        {search && `（搜索: "${search}"）`}
      </p>

      {/* 列表 */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-sm text-slate-400">加载中...</div>
        ) : products.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-400">
            {search ? "未找到匹配产品" : "暂无产品"}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left px-4 py-3 font-medium text-slate-600 w-12">图片</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">SKU</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">名称</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">分类</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">品牌</th>
                <th className="text-right px-4 py-3 font-medium text-slate-600">操作</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.sku} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3">
                    {Array.isArray(p.images) && p.images[0] ? (
                      <img src={p.images[0] as string} alt="" className="w-10 h-10 object-cover rounded" />
                    ) : (
                      <span className="text-xl">🔧</span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">{p.sku}</td>
                  <td className="px-4 py-3 font-medium text-slate-800">{p.name}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">{p.category?.name || "-"}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">{p.brand?.name || "-"}</td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/products/${p.sku}/edit`}
                      className="text-xs text-primary-600 hover:text-primary-700 mr-3"
                    >
                      编辑
                    </Link>
                    <button
                      onClick={() => handleDelete(p.sku, p.name)}
                      className="text-xs text-red-500 hover:text-red-600"
                    >
                      删除
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* 分页 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((n) => Math.abs(n - page) <= 3 || n === 1 || n === totalPages)
            .map((n, idx, arr) => (
              <>
                {idx > 0 && arr[idx - 1] !== n - 1 && (
                  <span key={`e-${n}`} className="px-2 text-slate-300">...</span>
                )}
                <button
                  key={n}
                  onClick={() => fetchProducts(n, search)}
                  className={`px-3 py-1.5 text-sm rounded-lg ${
                    n === page
                      ? "bg-slate-800 text-white"
                      : "border border-slate-200 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {n}
                </button>
              </>
            ))}
        </div>
      )}
    </div>
  );
}
