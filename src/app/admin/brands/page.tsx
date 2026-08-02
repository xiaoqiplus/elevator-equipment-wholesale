"use client";

import { useEffect, useState } from "react";

interface Brand {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  count: number;
}

export default function BrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  // 新增品牌
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState("");
  const [newSlug, setNewSlug] = useState("");

  // 编辑品牌
  const [editing, setEditing] = useState<Brand | null>(null);
  const [editName, setEditName] = useState("");
  const [editSlug, setEditSlug] = useState("");

  // 合并品牌
  const [merging, setMerging] = useState<Brand | null>(null);
  const [mergeTarget, setMergeTarget] = useState("");

  const load = (query = "") => {
    setLoading(true);
    fetch(`/api/admin/brands${query ? `?q=${encodeURIComponent(query)}` : ""}`)
      .then((r) => r.json())
      .then((data) => setBrands(data.brands || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    load(q);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName) return;
    const res = await fetch("/api/admin/brands", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName, slug: newSlug }),
    });
    const d = await res.json();
    if (res.ok) {
      setShowNew(false);
      setNewName("");
      setNewSlug("");
      setMsg(`✅ 已创建品牌「${newName}」`);
      load(q);
    } else {
      setMsg("❌ " + (d.error || "创建失败"));
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing || !editName) return;
    const res = await fetch("/api/admin/brands", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: editing.id, name: editName, slug: editSlug }),
    });
    const d = await res.json();
    if (res.ok) {
      setEditing(null);
      setMsg(`✅ 已更新品牌「${editName}」`);
      load(q);
    } else {
      setMsg("❌ " + (d.error || "更新失败"));
    }
  };

  const handleDelete = async (b: Brand) => {
    if (!confirm(`确定删除品牌「${b.name}」？`)) return;
    const res = await fetch(`/api/admin/brands?id=${b.id}`, { method: "DELETE" });
    const d = await res.json();
    if (res.ok) {
      setMsg(`✅ 已删除品牌「${b.name}」`);
      load(q);
    } else {
      setMsg("❌ " + (d.error || "删除失败"));
    }
  };

  const handleMerge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!merging || !mergeTarget) return;
    const to = brands.find((b) => b.id === mergeTarget);
    if (!to) return;
    if (!confirm(`将「${merging.name}」的 ${merging.count} 个产品合并到「${to.name}」，确定？`)) return;

    const res = await fetch("/api/admin/brands/merge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fromId: merging.id, toId: to.id }),
    });
    const d = await res.json();
    if (res.ok) {
      setMerging(null);
      setMergeTarget("");
      setMsg(`✅ 已合并：${d.moved} 个产品归入「${to.name}」`);
      load(q);
    } else {
      setMsg("❌ " + (d.error || "合并失败"));
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-semibold text-slate-800">🏷️ 品牌管理</h1>
        <button
          onClick={() => setShowNew(!showNew)}
          className="px-4 py-2 text-sm font-medium text-white bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors"
        >
          {showNew ? "取消" : "+ 新增品牌"}
        </button>
      </div>

      {msg && (
        <div className="mb-4 text-xs text-green-600 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
          {msg}
        </div>
      )}

      {/* 新增 */}
      {showNew && (
        <form onSubmit={handleCreate} className="mb-6 bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-3">
          <h2 className="text-sm font-semibold text-slate-700">新增品牌</h2>
          <div className="grid grid-cols-2 gap-3">
            <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)}
              placeholder="品牌名称 *" required
              className="px-3 py-2 text-sm rounded-lg border border-slate-300 focus:border-slate-500 outline-none" />
            <input type="text" value={newSlug} onChange={(e) => setNewSlug(e.target.value)}
              placeholder="slug（留空自动生成）"
              className="px-3 py-2 text-sm rounded-lg border border-slate-300 focus:border-slate-500 outline-none" />
          </div>
          <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-slate-800 rounded-lg hover:bg-slate-700">
            创建
          </button>
        </form>
      )}

      {/* 搜索 */}
      <form onSubmit={handleSearch} className="mb-4 flex gap-2">
        <input type="text" value={q} onChange={(e) => setQ(e.target.value)}
          placeholder="搜索品牌..."
          className="flex-1 px-3 py-2 text-sm rounded-lg border border-slate-300 focus:border-slate-500 outline-none" />
        <button type="submit" className="px-4 py-2 text-sm rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-300">
          搜索
        </button>
      </form>

      {loading ? (
        <div className="text-center py-12 text-sm text-slate-400">加载中...</div>
      ) : brands.length === 0 ? (
        <div className="text-center py-12 text-sm text-slate-400">暂无品牌</div>
      ) : (
        <div className="text-xs text-slate-400 mb-3">共 {brands.length} 个品牌</div>
      )}

      <div className="space-y-2">
        {brands.map((b) => (
          <div key={b.id} className="flex items-center justify-between bg-white rounded-lg border border-slate-200 px-4 py-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-800">{b.name}</span>
                <span className="text-xs text-slate-400 font-mono">{b.slug}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">{b.count} 产品</span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 ml-4">
              <button onClick={() => { setEditing(b); setEditName(b.name); setEditSlug(b.slug); }}
                className="px-3 py-1.5 text-xs rounded-md bg-slate-100 text-slate-600 hover:bg-slate-200">编辑</button>
              <button onClick={() => { setMerging(b); setMergeTarget(""); }}
                className="px-3 py-1.5 text-xs rounded-md bg-blue-50 text-blue-600 hover:bg-blue-100">合并</button>
              <button onClick={() => handleDelete(b)}
                className="px-3 py-1.5 text-xs rounded-md bg-red-50 text-red-500 hover:bg-red-100">删除</button>
            </div>
          </div>
        ))}
      </div>

      {/* 编辑弹窗 */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setEditing(null)}>
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-sm font-semibold text-slate-700 mb-4">编辑品牌</h2>
            <form onSubmit={handleEdit} className="space-y-3">
              <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)}
                placeholder="品牌名称" required
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:border-slate-500 outline-none" />
              <input type="text" value={editSlug} onChange={(e) => setEditSlug(e.target.value)}
                placeholder="slug"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:border-slate-500 outline-none" />
              <div className="flex gap-2 pt-2">
                <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-slate-800 rounded-lg hover:bg-slate-700">保存</button>
                <button type="button" onClick={() => setEditing(null)} className="px-4 py-2 text-sm text-slate-500 hover:text-slate-700">取消</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 合并弹窗 */}
      {merging && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setMerging(null)}>
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-sm font-semibold text-slate-700 mb-1">合并品牌</h2>
            <p className="text-xs text-slate-400 mb-4">
              将「{merging.name}」（{merging.count} 个产品）合并到目标品牌
            </p>
            <form onSubmit={handleMerge} className="space-y-3">
              <select value={mergeTarget} onChange={(e) => setMergeTarget(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:border-slate-500 outline-none bg-white">
                <option value="">选择目标品牌...</option>
                {brands.filter((b) => b.id !== merging.id).map((b) => (
                  <option key={b.id} value={b.id}>{b.name}（{b.count} 产品）</option>
                ))}
              </select>
              <div className="flex gap-2 pt-2">
                <button type="submit" disabled={!mergeTarget}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">
                  合并
                </button>
                <button type="button" onClick={() => setMerging(null)} className="px-4 py-2 text-sm text-slate-500 hover:text-slate-700">取消</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
