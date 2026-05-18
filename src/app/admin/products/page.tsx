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
import { ShieldAlert, Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import Link from "next/link";

interface Product {
  id: string;
  sku: string;
  name: string;
  price: number | null;
  category?: { name: string } | null;
}

export default function AdminProductsPage() {
  const { data: session, status } = useSession();
  const isAdmin = (session?.user as any)?.role === "ADMIN";

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchProducts = useCallback(async () => {
    
    try {
      const res = await fetch("/api/products?pageSize=100");
      const data = await res.json();
      setProducts(data.products ?? []);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) fetchProducts();
  }, [isAdmin, fetchProducts]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await fetch(`/api/admin/products/${deleteTarget.id}`, { method: "DELETE" });
      setProducts((prev) => prev.filter((p) => p.id !== deleteTarget.id));
    } catch {
      // handle error
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  if (status === "loading") return null;
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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">产品管理</h1>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          新增产品
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>SKU</TableHead>
            <TableHead>名称</TableHead>
            <TableHead>价格</TableHead>
            <TableHead>分类</TableHead>
            <TableHead className="w-40 text-right">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => (
              <TableRow key={product.id}>
                <TableCell className="font-mono">{product.sku}</TableCell>
                <TableCell className="font-medium">{product.name}</TableCell>
                <TableCell>
                  {product.price !== null ? `$${Number(product.price).toFixed(2)}` : "-"}
                </TableCell>
                <TableCell>{product.category?.name ?? "-"}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" aria-label="编辑">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="删除"
                      onClick={() => setDeleteTarget(product)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
        </TableBody>
      </Table>

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除产品「{deleteTarget?.name}」（SKU: {deleteTarget?.sku}）吗？此操作不可撤销。            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting}>
              {deleting ? "删除中…" : "确认删除"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
