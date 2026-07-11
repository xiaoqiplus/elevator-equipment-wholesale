"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function DeleteProductPage({ params }: { params: { sku: string } }) {
  const router = useRouter();
  const [product, setProduct] = useState<{ name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/admin/products?q=${params.sku}&limit=1`)
      .then((r) => r.json())
      .then((data) => {
        if (data.products?.[0]) setProduct(data.products[0]);
      });
  }, [params.sku]);

  const handleDelete = async () => {
    setDeleting(true);
    setError("");
    const res = await fetch(`/api/admin/products?sku=${params.sku}`, { method: "DELETE" });
    if (res.ok) {
      setDone(true);
    } else {
      const data = await res.json();
      setError(data.error || "删除失败");
      setDeleting(false);
    }
  };

  if (done) {
    return (
      <div className="text-center py-12">
        <p className="text-lg mb-4">✅ 已删除</p>
        <Link href="/admin/products" className="text-sm text-primary-600 hover:text-primary-700">
          ← 返回产品列表
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto py-12">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 text-center">
        <h1 className="text-lg font-semibold text-slate-800 mb-2">确认删除</h1>
        {product ? (
          <p className="text-sm text-slate-500 mb-6">
            确定要删除 <strong className="text-slate-700">{product.name}</strong>（SKU: {params.sku}）吗？<br />
            此操作不可恢复。
          </p>
        ) : (
          <p className="text-sm text-slate-400 mb-6">加载中...</p>
        )}

        {error && (
          <div className="mb-4 text-xs text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>
        )}

        <div className="flex items-center justify-center gap-3">
          <button
            onClick={handleDelete}
            disabled={deleting || !product}
            className="px-6 py-2.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-500 transition-colors disabled:opacity-50"
          >
            {deleting ? "⏳ 删除中..." : "确认删除"}
          </button>
          <Link
            href="/admin/products"
            className="px-4 py-2.5 text-sm text-slate-500 hover:text-slate-700"
          >
            取消
          </Link>
        </div>
      </div>
    </div>
  );
}
