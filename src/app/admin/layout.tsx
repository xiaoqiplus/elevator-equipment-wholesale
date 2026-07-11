"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [authed, setAuthed] = useState<boolean | null>(null);

  // 登录页不检查
  const isLoginPage = pathname === "/admin/login";

  useEffect(() => {
    if (isLoginPage) return;
    // 通过简单请求验证登录状态
    fetch("/api/admin/products?limit=1")
      .then((r) => {
        if (r.ok) setAuthed(true);
        else router.push("/admin/login");
      })
      .catch(() => router.push("/admin/login"));
  }, [isLoginPage, router]);

  if (isLoginPage) return <>{children}</>;

  if (authed === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-slate-400 text-sm">验证中...</div>
      </div>
    );
  }

  if (!authed) return null;

  const navLinks = [
    { href: "/admin", label: "概览", icon: "📊" },
    { href: "/admin/products", label: "产品管理", icon: "📦" },
    { href: "/admin/uploads", label: "上传图片", icon: "📤" },
  ];

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* 侧边栏 */}
      <aside className="fixed inset-y-0 left-0 w-56 bg-slate-900 text-white z-40 flex flex-col shadow-2xl">
        <div className="px-5 py-5 border-b border-slate-700">
          <Link href="/admin" className="flex items-center gap-2">
            <span className="text-xl">⚙</span>
            <span className="font-semibold text-sm">管理后台</span>
          </Link>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                isActive(l.href)
                  ? "bg-primary-600/20 text-primary-300"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <span>{l.icon}</span>
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="px-4 py-3 border-t border-slate-700 space-y-2">
          <a
            href="/"
            className="block text-xs text-slate-400 hover:text-white transition-colors"
            target="_blank"
          >
            ← 返回前台
          </a>
          <a
            href="/api/admin/logout"
            className="block text-xs text-red-400 hover:text-red-300 transition-colors"
          >
            退出登录
          </a>
        </div>
      </aside>

      {/* 主内容 */}
      <main className="ml-56 flex-1 min-h-screen">
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
