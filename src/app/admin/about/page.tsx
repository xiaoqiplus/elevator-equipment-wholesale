"use client";

import { useEffect, useState } from "react";

export default function AboutEditPage() {
  const [body, setBody] = useState("");
  const [advantages, setAdvantages] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetch("/api/admin/site-config")
      .then((r) => r.json())
      .then((data) => {
        if (data.ok && data.config) {
          setBody(data.config.about_body || "");
          setAdvantages(data.config.about_advantages || "");
        }
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

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
          about_advantages: advantages,
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
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-slate-700">正文内容</h2>
          <p className="text-xs text-slate-400">
            每个段落用空行分隔。留空则显示默认内容。
          </p>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={10}
            placeholder="QuickEase Lift Parts is a professional elevator parts supplier...

Our product range covers all major elevator brands including Otis, Kone..."
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:border-slate-500 outline-none resize-none font-mono"
          />
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-slate-700">
            Why Us 优势列表
          </h2>
          <p className="text-xs text-slate-400">
            JSON 格式：{`[{"title":"标题","desc":"描述"},...]`}。留空则显示默认。
          </p>
          <textarea
            value={advantages}
            onChange={(e) => setAdvantages(e.target.value)}
            rows={8}
            placeholder='[{"title":"Extensive Inventory","desc":"Thousands of elevator parts in stock, ready to ship."}]'
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:border-slate-500 outline-none resize-none font-mono"
          />
          {advantages && (
            <div className="text-xs text-slate-400">
              ✅ JSON 格式正确，共{" "}
              {(() => {
                try {
                  return JSON.parse(advantages).length;
                } catch {
                  return 0;
                }
              })()}{" "}
              项
            </div>
          )}
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
