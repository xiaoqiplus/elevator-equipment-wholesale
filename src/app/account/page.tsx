"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  User,
  FileText,
  Heart,
  Loader2,
  LogIn,
  ChevronRight,
  Clock,
} from "lucide-react";

interface Quotation {
  id: string;
  status: "PENDING" | "RESPONDED" | "CONVERTED_TO_ORDER";
  items: Array<{ sku: string; name: string; quantity: number; price?: number }>;
  adminNotes: string | null;
  createdAt: string;
}

const statusLabels: Record<string, string> = {
  PENDING: "待处理",
  RESPONDED: "已回复",
  CONVERTED_TO_ORDER: "已转订单",
};

const statusColors: Record<string, "secondary" | "default" | "outline"> = {
  PENDING: "secondary",
  RESPONDED: "default",
  CONVERTED_TO_ORDER: "outline",
};

export default function AccountPage() {
  const { data: session, status: authStatus } = useSession();
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchQuotations = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/quotations");
      const data = await res.json();
      setQuotations(Array.isArray(data) ? data : []);
    } catch {
      setQuotations([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authStatus === "authenticated") {
      fetchQuotations();
    }
  }, [authStatus, fetchQuotations]);

  // ── Loading ────────────────────────────────────────────────────────────
  if (authStatus === "loading") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // ── Not authenticated ──────────────────────────────────────────────────
  if (authStatus === "unauthenticated") {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <LogIn className="mb-4 h-16 w-16 text-muted-foreground" />
        <h1 className="mb-2 text-3xl font-bold">用户中心</h1>
        <p className="mb-6 text-muted-foreground">
          请登录后查看您的账户信息。
        </p>
        <Button asChild>
          <Link href="/login">前往登录</Link>
        </Button>
      </div>
    );
  }

  const user = session?.user;
  const isApproved = (user as any)?.isApproved;
  const role = (user as any)?.role;
  const companyName = (user as any)?.companyName;

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      {/* ── Profile Header ──────────────────────────────────────────────── */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
            <User className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{user?.name ?? user?.email}</h1>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {isApproved && (
                <Badge variant="secondary" className="text-xs">
                  已认证
                </Badge>
              )}
              {role === "ADMIN" && (
                <Badge className="text-xs" variant="default">
                  <Link href="/admin" className="hover:underline">
                    管理员
                  </Link>
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Account Info Cards ──────────────────────────────────────────────── */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">公司</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">
              {companyName ?? "未填写"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">报价记录</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">{quotations.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">账户角色</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">
              {role === "ADMIN" ? "管理员" : "客户"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ── Tabs ─────────────────────────────────────────────────────────── */}
      <Tabs defaultValue="quotations">
        <TabsList className="mb-6">
          <TabsTrigger value="quotations" className="gap-2">
            <FileText className="h-4 w-4" />
            报价记录
          </TabsTrigger>
          <TabsTrigger value="favorites" className="gap-2">
            <Heart className="h-4 w-4" />
            收藏夹
          </TabsTrigger>
        </TabsList>

        {/* ── Quotations Tab ─────────────────────────────────────────────── */}
        <TabsContent value="quotations">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : quotations.length === 0 ? (
            <div className="rounded-lg border border-dashed p-12 text-center">
              <FileText className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">暂无报价记录</p>
              <Button variant="link" asChild className="mt-2">
                <Link href="/products">去浏览产品</Link>
              </Button>
            </div>
          ) : (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>报价编号</TableHead>
                    <TableHead>产品数量</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead className="hidden sm:table-cell">提交时间</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {quotations.map((q) => {
                    const itemCount = Array.isArray(q.items) ? q.items.length : 0;
                    const skus = Array.isArray(q.items)
                      ? q.items.slice(0, 3).map((i) => i.name || i.sku).join("、")
                      : "";
                    return (
                      <TableRow key={q.id}>
                        <TableCell className="font-mono text-xs">
                          <div>{q.id.slice(-8).toUpperCase()}</div>
                          <div className="mt-0.5 text-muted-foreground line-clamp-1 max-w-[200px]">
                            {skus}
                            {itemCount > 3 && ` 等${itemCount}项`}
                          </div>
                        </TableCell>
                        <TableCell>{itemCount} 项</TableCell>
                        <TableCell>
                          <Badge variant={statusColors[q.status]}>
                            {statusLabels[q.status]}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden text-muted-foreground sm:table-cell">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(q.createdAt).toLocaleDateString("zh-CN")}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" asChild>
                            <Link href={`/quotation?id=${q.id}`}>
                              <ChevronRight className="h-4 w-4" />
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        {/* ── Favorites Tab ──────────────────────────────────────────────── */}
        <TabsContent value="favorites">
          <div className="rounded-lg border border-dashed p-12 text-center">
            <Heart className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
            <p className="mb-1 text-sm font-medium">收藏功能即将上线</p>
            <p className="text-xs text-muted-foreground">
              您将可以在这里管理收藏的产品，方便快速询价。
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
