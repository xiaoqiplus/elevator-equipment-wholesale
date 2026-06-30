import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t bg-slate-50">
      <div className="container mx-auto px-4 py-10">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {/* Company */}
          <div>
            <h3 className="mb-3 text-sm font-semibold text-slate-800">QuickEasy Lift Parts</h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              Quick Delivery. Easy Service. Zero Downtime.
            </p>
            <p className="mt-2 text-sm text-slate-500 leading-relaxed">
              专业电梯零部件供应商，致力于为电梯维保公司、安装公司及电梯制造商提供高品质的电梯配件产品。
            </p>
          </div>

          {/* Quick links */}
          <div>
            <h3 className="mb-3 text-sm font-semibold text-slate-800">快速链接</h3>
            <div className="flex flex-col space-y-2">
              <Link href="/products" className="text-sm text-slate-500 hover:text-slate-800">
                产品中心
              </Link>
              <Link href="/categories" className="text-sm text-slate-500 hover:text-slate-800">
                产品分类
              </Link>
              <Link href="/about" className="text-sm text-slate-500 hover:text-slate-800">
                关于我们
              </Link>
              <Link href="/contact" className="text-sm text-slate-500 hover:text-slate-800">
                联系我们
              </Link>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h3 className="mb-3 text-sm font-semibold text-slate-800">联系方式</h3>
            <div className="space-y-2 text-sm text-slate-500">
              <p>📞 电话：138-xxxx-xxxx</p>
              <p>📧 邮箱：info@xx-elevator.com</p>
              <p>💬 微信：xx-elevator-parts</p>
              <p>📍 地址：XX省XX市XX区XX路XX号</p>
            </div>
          </div>
        </div>

        <div className="mt-8 border-t pt-6 text-center text-xs text-slate-400">
          © {new Date().getFullYear()} QuickEasy Lift Parts 版权所有
        </div>
      </div>
    </footer>
  );
}
