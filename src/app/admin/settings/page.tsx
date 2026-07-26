"use client";

import { useEffect, useState } from "react";

export default function SettingsPage() {
  const [form, setForm] = useState({
    contact_email: "",
    contact_phone: "",
    contact_whatsapp: "",
    company_name: "",
    company_slogan: "",
  });
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetch("/api/admin/site-config")
      .then((r) => r.json())
      .then((data) => {
        if (data.ok && data.config) {
          setForm((prev) => ({ ...prev, ...data.config }));
        }
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  const update = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg("");
    try {
      const res = await fetch("/api/admin/site-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setMsg("✅ 保存成功");
      } else {
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
    <div className="max-w-2xl">
      <h1 className="text-lg font-semibold text-slate-800 mb-6">
        ⚙️ 站点设置
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
        {/* 公司信息 */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-slate-700">公司信息</h2>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              公司名称
            </label>
            <input
              type="text"
              value={form.company_name}
              onChange={(e) => update("company_name", e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:border-slate-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Slogan
            </label>
            <input
              type="text"
              value={form.company_slogan}
              onChange={(e) => update("company_slogan", e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:border-slate-500 outline-none"
            />
          </div>
        </div>

        {/* 联系方式 */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-slate-700">联系方式</h2>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              邮箱
            </label>
            <input
              type="email"
              value={form.contact_email}
              onChange={(e) => update("contact_email", e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:border-slate-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              电话
            </label>
            <input
              type="text"
              value={form.contact_phone}
              onChange={(e) => update("contact_phone", e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:border-slate-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              WhatsApp 号码
            </label>
            <input
              type="text"
              value={form.contact_whatsapp}
              onChange={(e) => update("contact_whatsapp", e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:border-slate-500 outline-none"
            />
          </div>
        </div>

        {/* 提交 */}
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2.5 text-sm font-medium text-white bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors disabled:opacity-50"
        >
          {saving ? "⏳ 保存中..." : "保存设置"}
        </button>
      </form>
    </div>
  );
}
