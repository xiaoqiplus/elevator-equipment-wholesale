"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  sku?: string; // 编辑模式传参
}

interface Category { slug: string; name: string; }
interface Brand { slug: string; name: string; }

export default function ProductForm({ sku }: Props) {
  const router = useRouter();
  const isEdit = !!sku;

  const [form, setForm] = useState({
    name: "",
    description: "",
    categorySlug: "",
    brandSlug: "",
    images: [""] as string[],
    specs: [["", ""]] as [string, string][],
    warranty: "",
    leadTime: "",
    payment: "",
    isHot: false,
  });
  const [currentSku, setCurrentSku] = useState(sku || "");
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // 加载分类和品牌
    Promise.all([
      fetch("/api/admin/categories-brands?type=categories").then((r) => r.json()),
      fetch("/api/admin/categories-brands?type=brands").then((r) => r.json()),
    ]).then(([cats, brs]) => {
      setCategories(cats);
      setBrands(brs);
    });

    // 编辑模式：加载产品数据
    if (sku) {
      fetch(`/api/admin/products?q=${sku}&limit=1`)
        .then((r) => r.json())
        .then((data) => {
          const p = data.products?.[0];
          if (p) {
            const imgs = Array.isArray(p.images) && p.images.length > 0
              ? p.images.map((i: any) => String(i))
              : [""];
            const specsArr: [string, string][] = p.specs && typeof p.specs === "object"
              ? Object.entries(p.specs).map(([k, v]) => [k, String(v)])
              : [["", ""]];
            setForm({
              name: p.name || "",
              description: p.description || "",
              categorySlug: p.category?.slug || "",
              brandSlug: p.brand?.slug || "",
              images: imgs,
              specs: specsArr,
              warranty: p.warranty || "",
              leadTime: p.leadTime || "",
              payment: p.payment || "",
              isHot: !!p.isHot,
            });
          }
          setLoading(false);
        })
        .catch(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [sku]);

  const updateField = (field: string, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const updateImage = (idx: number, val: string) => {
    const imgs = [...form.images];
    imgs[idx] = val;
    updateField("images", imgs);
  };

  const addImage = () => updateField("images", [...form.images, ""]);
  const removeImage = (idx: number) => {
    if (form.images.length <= 1) return;
    updateField("images", form.images.filter((_, i) => i !== idx));
  };

  const updateSpec = (idx: number, field: 0 | 1, val: string) => {
    const specs = [...form.specs] as [string, string][];
    specs[idx] = [...specs[idx]] as [string, string];
    specs[idx][field] = val;
    updateField("specs", specs);
  };

  const addSpec = () => updateField("specs", [...form.specs, ["", ""]]);
  const removeSpec = (idx: number) => {
    if (form.specs.length <= 1) return;
    updateField("specs", form.specs.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    const images = form.images.filter(Boolean);
    const specsObj: Record<string, string> = {};
    form.specs.forEach(([k, v]) => {
      if (k && v) specsObj[k] = v;
    });

    const body = {
      sku: sku || currentSku,
      newSku: isEdit && currentSku !== sku ? currentSku : undefined,
      name: form.name,
      description: form.description,
      categorySlug: form.categorySlug || undefined,
      brandSlug: form.brandSlug || undefined,
      images: images.length > 0 ? images : undefined,
      specs: Object.keys(specsObj).length > 0 ? specsObj : undefined,
      warranty: form.warranty || undefined,
      leadTime: form.leadTime || undefined,
      payment: form.payment || undefined,
      isHot: form.isHot,
    };

    try {
      const res = await fetch("/api/admin/products", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        router.push("/admin/products");
      } else {
        const data = await res.json();
        setError(data.error || "保存失败");
      }
    } catch {
      setError("网络错误");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-sm text-slate-400">加载中...</div>;
  }

  return (
    <div>
      <h1 className="text-lg font-semibold text-slate-800 mb-6">
        {isEdit ? "✏️ 编辑产品" : "➕ 新增产品"}
      </h1>

      {error && (
        <div className="mb-4 text-xs text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
        {/* 基本信息 */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-slate-700">基本信息</h2>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">SKU *</label>
            <input
              type="text"
              value={currentSku}
              onChange={(e) => setCurrentSku(e.target.value)}
              required
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:border-slate-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">产品名称 *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => updateField("name", e.target.value)}
              required
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:border-slate-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">描述</label>
            <textarea
              value={form.description}
              onChange={(e) => updateField("description", e.target.value)}
              rows={3}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:border-slate-500 outline-none resize-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Warranty</label>
              <input
                type="text"
                value={form.warranty}
                onChange={(e) => updateField("warranty", e.target.value)}
                placeholder="12 months"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:border-slate-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Lead Time</label>
              <input
                type="text"
                value={form.leadTime}
                onChange={(e) => updateField("leadTime", e.target.value)}
                placeholder="3-5 working days"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:border-slate-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Payment</label>
              <input
                type="text"
                value={form.payment}
                onChange={(e) => updateField("payment", e.target.value)}
                placeholder="Western Union/PayPal/T/T"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:border-slate-500 outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isHot"
              checked={form.isHot}
              onChange={(e) => updateField("isHot", e.target.checked)}
              className="h-4 w-4 rounded border-slate-300"
            />
            <label htmlFor="isHot" className="text-sm text-slate-700">🔥 热销产品</label>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">分类</label>
              <select
                value={form.categorySlug}
                onChange={(e) => updateField("categorySlug", e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:border-slate-500 outline-none"
              >
                <option value="">无分类</option>
                {categories.map((c) => (
                  <option key={c.slug} value={c.slug}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">品牌</label>
              <select
                value={form.brandSlug}
                onChange={(e) => updateField("brandSlug", e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:border-slate-500 outline-none"
              >
                <option value="">无品牌</option>
                {brands.map((b) => (
                  <option key={b.slug} value={b.slug}>{b.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* 图片 */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-700">图片 URL</h2>
            <button type="button" onClick={addImage} className="text-xs text-primary-600 hover:text-primary-700">
              + 添加图片
            </button>
          </div>
          {form.images.map((url, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <input
                type="text"
                value={url}
                onChange={(e) => updateImage(idx, e.target.value)}
                placeholder={`/uploads/{SKU}/${idx + 1}.jpg`}
                className="flex-1 px-3 py-2 text-sm rounded-lg border border-slate-300 focus:border-slate-500 outline-none"
              />
              <label className="shrink-0 cursor-pointer px-2 py-1.5 text-xs text-white bg-slate-700 rounded hover:bg-slate-600 transition-colors">
                上传
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const fd = new FormData();
                    fd.append("file", file);
                    const editSku = sku || currentSku;
                    if (editSku) fd.append("sku", editSku);
                    try {
                      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
                      if (res.ok) {
                        const data = await res.json();
                        updateImage(idx, data.url);
                      }
                    } catch {}
                    e.target.value = "";
                  }}
                />
              </label>
              {url && (
                <img src={url} alt="" className="w-10 h-10 object-cover rounded border shrink-0" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              )}
              <button type="button" onClick={() => removeImage(idx)} className="text-red-400 hover:text-red-600 text-sm px-1 shrink-0">
                ✕
              </button>
            </div>
          ))}
        </div>

        {/* 规格参数 */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-700">规格参数</h2>
            <button type="button" onClick={addSpec} className="text-xs text-primary-600 hover:text-primary-700">
              + 添加参数
            </button>
          </div>
          {form.specs.map(([k, v], idx) => (
            <div key={idx} className="flex items-center gap-2">
              <input
                type="text"
                value={k}
                onChange={(e) => updateSpec(idx, 0, e.target.value)}
                placeholder="参数名"
                className="w-40 px-3 py-2 text-sm rounded-lg border border-slate-300 focus:border-slate-500 outline-none"
              />
              <input
                type="text"
                value={v}
                onChange={(e) => updateSpec(idx, 1, e.target.value)}
                placeholder="参数值"
                className="flex-1 px-3 py-2 text-sm rounded-lg border border-slate-300 focus:border-slate-500 outline-none"
              />
              <button type="button" onClick={() => removeSpec(idx)} className="text-red-400 hover:text-red-600 text-sm px-1">
                ✕
              </button>
            </div>
          ))}
        </div>

        {/* 提交 */}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 text-sm font-medium text-white bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors disabled:opacity-50"
          >
            {saving ? "⏳ 保存中..." : isEdit ? "保存修改" : "创建产品"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/admin/products")}
            className="px-4 py-2.5 text-sm text-slate-500 hover:text-slate-700"
          >
            取消
          </button>
        </div>
      </form>
    </div>
  );
}
