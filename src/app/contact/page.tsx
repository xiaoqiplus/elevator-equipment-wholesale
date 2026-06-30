import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "联系我们",
  description: "联系我们获取电梯配件产品信息",
};

export default function ContactPage() {
  return (
    <div className="container mx-auto px-4 py-16">
      <h1 className="mb-6 text-3xl font-bold text-slate-800">联系我们</h1>
      <div className="grid gap-8 md:grid-cols-2">
        <div className="space-y-4 text-sm text-slate-600">
          <div className="rounded-lg border p-4">
            <h3 className="mb-2 text-base font-semibold text-slate-700">📞 电话</h3>
            <p>138-xxxx-xxxx</p>
          </div>
          <div className="rounded-lg border p-4">
            <h3 className="mb-2 text-base font-semibold text-slate-700">📧 邮箱</h3>
            <p>info@xx-elevator.com</p>
          </div>
          <div className="rounded-lg border p-4">
            <h3 className="mb-2 text-base font-semibold text-slate-700">💬 微信</h3>
            <p>xx-elevator-parts</p>
          </div>
          <div className="rounded-lg border p-4">
            <h3 className="mb-2 text-base font-semibold text-slate-700">📍 地址</h3>
            <p>XX省XX市XX区XX路XX号</p>
          </div>
        </div>
        <div className="flex items-center justify-center rounded-lg border bg-slate-50 p-10">
          <p className="text-sm text-slate-400">（此处可放置微信二维码图片）</p>
        </div>
      </div>
    </div>
  );
}
