"use client";

import { useEffect, useState } from "react";

interface AdvItem {
  title: string;
  desc: string;
}

export default function AboutEditPage() {
  const [body, setBody] = useState("");
  const [advantages, setAdvantages] = useState<AdvItem[]>([
    { title: "", desc: "" },
  ]);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetch("/api/admin/site-config")
      .then((r) => r.json())
      .then((data) => {
        if (data.ok && data.config) {
          setBody(data.config.about_body || "");
          if (data.config.about_advantages) {
            try {
              const parsed = JSON.parse(data.config.about_advantages);
              if (Array.isArray(parsed) && parsed.length > 0) {
                setAdvantages(parsed);
              }
            } catch {}
          }
        }
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  const addAdv = () => setAdvantages([...advantages, { title: "", desc: "" }]);
  const removeAdv = (idx: number) => {
    if (advantages.length <= 1) return;
    setAdvantages(advantages.filter((_, i) => i !== idx));
  };
  const updateAdv = (idx: number, field: "title" | "desc", val: string) => {
    const list = [...advantages];
    list[idx] = { ...list[idx], [field]: val };
    setAdvantages(list);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg("");
    try {
      const res = await fetch("/api/admin/site-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          about_body: body,
          about_advantages: JSON.stringify(
            advantages.filter((a) => a.title.trim()),
          ),
        }),
      });
      if (res.ok) setMsg("✅ 保存成功");
      else {
        const d = await res.json();
        setMsg("❌ " + (d.error || "保存失败"));
      }
    } catch {
      setMsg("❌ 网络错误");
    } finally {
      setSaving(false);
    }
  };

  if (!loaded) {
    return (
      <div className="text-center py-12 text-sm text-slate-400">加载中...</div>
    );
  }

  return (
    <div className="max-w-3xl">
      <h1 className="text-lg font-semibold text-slate-800 mb-6">
        ✏️ 关于我们
      </h1>

      {msg && (
        <div
          className={`mb-4 text-xs rounded-lg px-3 py-2 ${
            msg.startsWith("✅")
              ? "text-green-600 bg-green-50 border border-green-200"
              : "text-red-500 bg-red-50 border border-red-200"
          }`}
        >
          {msg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 正文 */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-slate-700">正文内容</h2>
          <p className="text-xs text-slate-400">
            每行一个段落，空行会被忽略。留空则显示默认内容。
          </p>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={10}
            placeholder="QuickEase Lift Parts is a professional elevator parts supplier..."
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:border-slate-500 outline-none resize-none"
          />
        </div>

        {/* Why Us 优势列表 */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-700">
              Why Us 优势
            </h2>
            <button
              type="button"
              onClick={addAdv}
              className="text-xs text-primary-600 hover:text-primary-700"
            >
              + 添加优势
            </button>
          </div>
          {advantages.map((item, idx) => (
            <div
              key={idx}
              className="flex items-start gap-2 rounded-lg border border-slate-100 bg-slate-50 p-3"
            >
              <div className="flex-1 space-y-2">
                <input
                  type="text"
                  value={item.title}
                  onChange={(e) => updateAdv(idx, "title", e.target.value)}
                  placeholder="标题（如：Fast Shipping）"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:border-slate-500 outline-none"
                />
                <input
                  type="text"
                  value={item.desc}
                  onChange={(e) => updateAdv(idx, "desc", e.target.value)}
                  placeholder="描述"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:border-slate-500 outline-none"
                />
              </div>
              <button
                type="button"
                onClick={() => removeAdv(idx)}
                className="text-red-400 hover:text-red-600 text-sm px-1 mt-2 shrink-0"
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2.5 text-sm font-medium text-white bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors disabled:opacity-50"
        >
          {saving ? "⏳ 保存中..." : "保存"}
        </button>
      </form>
    </div>
  );
}
