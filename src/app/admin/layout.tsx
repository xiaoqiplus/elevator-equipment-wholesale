"use client";

import React from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Package,
  FileText,
  Users,
  Home,
  ShieldAlert,
  ArrowLeft,
} from "lucide-react";

const navItems = [
  { href: "/admin/products", label: "产品管理", icon: Package },
  { href: "/admin/quotations", label: "报价管理", icon: FileText },
  { href: "/admin/users", label: "用户管理", icon: Users },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Loading
  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  // Not authenticated or not admin
  const isAdmin = (session?.user as any)?.role === "ADMIN";
  if (!isAdmin) {
    return (
      <div className="container mx-auto flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
        <ShieldAlert className="mb-4 h-16 w-16 text-destructive" />
        <h1 className="mb-2 text-3xl font-bold">403 禁止访问</h1>
        <p className="mb-6 text-muted-foreground">
          您无权访问管理后台。
        </p>
        <Button asChild>
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回首页
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      {/* Sidebar */}
      <aside className="hidden w-64 flex-shrink-0 border-r bg-muted/30 p-6 md:block">
        <Link href="/admin" className="mb-6 flex items-center gap-2">
          <Home className="h-5 w-5" />
          <span className="font-semibold">管理后台</span>
        </Link>

        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-8 border-t pt-4">
          <Button variant="ghost" size="sm" asChild className="w-full justify-start">
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              返回前台
            </Link>
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-6 md:p-8">{children}</main>
    </div>
  );
}
