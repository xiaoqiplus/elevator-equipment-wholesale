"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewKnowledgePage() {
  const router = useRouter();
  const [form, setForm] = useState({
    title: "",
    url: "",
    summary: "",
    content: "",
    images: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const update = (f: string, v: string) => setForm((p) => ({ ...p, [f]: v }));

  const handleUpload = async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async (e: any) => {
      const file = e.target?.files?.[0];
      if (!file) return;
      const fd = new FormData();
      fd.append("file", file);
      try {
        const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
        if (res.ok) {
          const data = await res.json();
          update("images", data.url);
        }
      } catch {}
    };
    input.click();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title) {
      setError("标题不能为空");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/admin/knowledge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          url: form.url,
          summary: form.summary,
          content: form.content,
          images: form.images || null,
        }),
      });
      if (res.ok) router.push("/admin/knowledge");
      else {
        const d = await res.json();
        setError(d.error || "保存失败");
      }
    } catch {
      setError("网络错误");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-lg font-semibold text-slate-800 mb-6">
        ➕ 新增文章
      </h1>

      {error && (
        <div className="mb-4 text-xs text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              标题 *
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => update("title", e.target.value)}
              required
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:border-slate-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              URL（原文链接）
            </label>
            <input
              type="text"
              value={form.url}
              onChange={(e) => update("url", e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:border-slate-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              摘要
            </label>
            <textarea
              value={form.summary}
              onChange={(e) => update("summary", e.target.value)}
              rows={3}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:border-slate-500 outline-none resize-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              内容
            </label>
            <textarea
              value={form.content}
              onChange={(e) => update("content", e.target.value)}
              rows={8}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:border-slate-500 outline-none resize-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              封面图片
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={form.images}
                onChange={(e) => update("images", e.target.value)}
                placeholder="图片URL或上传"
                className="flex-1 px-3 py-2 text-sm rounded-lg border border-slate-300 focus:border-slate-500 outline-none"
              />
              <button
                type="button"
                onClick={handleUpload}
                className="shrink-0 px-3 py-2 text-xs text-white bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors"
              >
                上传
              </button>
              {form.images && (
                <img
                  src={form.images}
                  alt=""
                  className="w-10 h-10 object-cover rounded border shrink-0"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 text-sm font-medium text-white bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors disabled:opacity-50"
          >
            {saving ? "⏳ 保存中..." : "创建"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/admin/knowledge")}
            className="px-4 py-2.5 text-sm text-slate-500 hover:text-slate-700"
          >
            取消
          </button>
        </div>
      </form>
    </div>
  );
}
