"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ShieldAlert, Eye, Loader2 } from "lucide-react";

interface Quotation {
  id: string;
  status: string;
  items: any[];
  createdAt: string;
  user?: { name?: string; email?: string };
}

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  RESPONDED: "bg-blue-100 text-blue-800",
  CONVERTED_TO_ORDER: "bg-green-100 text-green-800",
};

export default function AdminQuotationsPage() {
  const { data: session, status: authStatus } = useSession();
  const isAdmin = (session?.user as any)?.role === "ADMIN";
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusTarget, setStatusTarget] = useState<Quotation | null>(null);
  const [newStatus, setNewStatus] = useState("RESPONDED");

  const fetchQuotations = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/quotations");
      const data = await res.json();
      setQuotations(data ?? []);
    } catch {
      setQuotations([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) fetchQuotations();
  }, [isAdmin, fetchQuotations]);

  const handleStatusChange = async () => {
    if (!statusTarget) return;
    try {
      await fetch(`/api/admin/quotations/${statusTarget.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      setQuotations((prev) =>
        prev.map((q) =>
          q.id === statusTarget.id ? { ...q, status: newStatus } : q
        )
      );
    } catch {
      // handle error
    } finally {
      setStatusTarget(null);
    }
  };

  if (authStatus === "loading") return null;
  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <ShieldAlert className="mb-4 h-16 w-16 text-destructive" />
        <h1 className="text-2xl font-bold">403 禁止访问</h1>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">报价管理</h1>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>客户</TableHead>
            <TableHead>状态</TableHead>
            <TableHead>时间</TableHead>
            <TableHead className="w-48 text-right">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={5} className="py-8 text-center">
                <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
              </TableCell>
            </TableRow>
          ) : (
            quotations.map((q) => (
              <TableRow key={q.id}>
                <TableCell className="font-mono text-xs">{q.id}</TableCell>
                <TableCell>{q.user?.name ?? q.user?.email ?? "-"}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={statusColors[q.status] ?? ""}>
                    {q.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {new Date(q.createdAt).toLocaleDateString("zh-CN")}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="sm" aria-label="查看详情">
                      <Eye className="mr-1 h-3.5 w-3.5" />
                      查看详情
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label="更改状态"
                      onClick={() => {
                        setStatusTarget(q);
                        setNewStatus(q.status === "RESPONDED" ? "CONVERTED_TO_ORDER" : "RESPONDED");
                      }}
                    >
                      更改状态
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <AlertDialog
        open={!!statusTarget}
        onOpenChange={(open) => !open && setStatusTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>更改状态</AlertDialogTitle>
            <AlertDialogDescription>
              更新报价单 {statusTarget?.id} 的状态：
            </AlertDialogDescription>
          </AlertDialogHeader>

          <select
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value)}
            aria-label="状态"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="RESPONDED">RESPONDED</option>
            <option value="CONVERTED_TO_ORDER">CONVERTED_TO_ORDER</option>
          </select>

          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleStatusChange}>确认</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
