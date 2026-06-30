import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "关于我们",
  description: "了解XX电梯配件 — 专业电梯零部件供应商",
};

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-16">
      <h1 className="mb-6 text-3xl font-bold text-slate-800">关于 QuickEasy Lift Parts</h1>
      <div className="max-w-3xl space-y-4 text-sm text-slate-600 leading-relaxed">
        <p>
          QuickEasy Lift Parts 是一家专业从事电梯零部件销售与服务的企业，致力于为电梯维保公司、安装公司及电梯制造商提供高品质的电梯配件产品。
        </p>
        <p>
          <strong>Quick Delivery. Easy Service. Zero Downtime.</strong> 是我们的核心理念。我们与国内外多家知名电梯配件生产厂商建立了长期稳定的合作关系，确保产品的质量可靠、型号齐全、供货及时。
        </p>
      </div>
    </div>
  );
}
