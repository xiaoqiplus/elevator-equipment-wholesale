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
import { ShieldAlert, Loader2, CheckCircle2 } from "lucide-react";

interface User {
  id: string;
  email: string;
  name: string | null;
  companyName: string | null;
  isApproved: boolean;
  role: string;
}

export default function AdminUsersPage() {
  const { data: session, status: authStatus } = useSession();
  const isAdmin = (session?.user as any)?.role === "ADMIN";
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      setUsers(data ?? []);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) fetchUsers();
  }, [isAdmin, fetchUsers]);

  const handleApprove = async (userId: string) => {
    setApprovingId(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}/approve`, { method: "PATCH" });
      if (res.ok) {
        setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, isApproved: true } : u)));
      }
    } catch {
      // handle error
    } finally {
      setApprovingId(null);
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
      <h1 className="text-2xl font-bold">用户管理</h1>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>邮箱</TableHead>
            <TableHead>姓名</TableHead>
            <TableHead>公司</TableHead>
            <TableHead>审批状态</TableHead>
            <TableHead className="w-28 text-right">操作</TableHead>
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
            users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.name ?? "-"}</TableCell>
                <TableCell>{user.companyName ?? "-"}</TableCell>
                <TableCell>
                  {user.isApproved ? (
                    <Badge variant="secondary" className="gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      已审批
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground">
                      待审批
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {!user.isApproved && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleApprove(user.id)}
                      disabled={approvingId === user.id}
                      aria-label="审批"
                    >
                      {approvingId === user.id ? "审批中..." : "审批"}
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
