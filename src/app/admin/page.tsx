"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldAlert, Package, FileText, Users, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const adminCards = [
  {
    href: "/admin/products",
    title: "产品管理",
    description: "管理产品目录、价格和分类",
    icon: Package,
  },
  {
    href: "/admin/quotations",
    title: "报价管理",
    description: "查看和处理客户报价请求",
    icon: FileText,
  },
  {
    href: "/admin/users",
    title: "用户管理",
    description: "审批新注册客户账户",
    icon: Users,
  },
];

export default function AdminPage() {
  const { data: session, status } = useSession();
  const isAdmin = (session?.user as any)?.role === "ADMIN";

  if (status === "loading") return null;
  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <ShieldAlert className="mb-4 h-16 w-16 text-destructive" />
        <h1 className="mb-2 text-3xl font-bold">403 禁止访问</h1>
        <p className="mb-6 text-muted-foreground">请使用管理员账户登录。</p>
        <Button asChild>
          <Link href="/"><ArrowLeft className="mr-2 h-4 w-4" />返回首页</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">管理后台</h1>
        <p className="mt-1 text-muted-foreground">
          欢迎回来，{session?.user?.name ?? session?.user?.email}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {adminCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link key={card.href} href={card.href}>
              <Card className="h-full transition-colors hover:bg-muted/50">
                <CardHeader>
                  <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-lg">{card.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {card.description}
                  </p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
