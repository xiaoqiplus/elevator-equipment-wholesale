"use client";

import { Button } from "@/components/ui/button";
import ProductCard from "./ProductCard";
import ProductSkeleton from "./ProductSkeleton";
import { AlertCircle, RefreshCw, PackageOpen } from "lucide-react";

export interface ProductData {
  sku: string;
  name: string;
  description?: string;
  price: number | null;
  images: string[];
  specs?: Record<string, unknown> | null;
  category?: { name: string; slug: string } | null;
  brand?: { name: string; slug: string } | null;
}

interface ProductListProps {
  products?: ProductData[];
  total?: number;
  page?: number;
  pageSize?: number;
  onPageChange?: (newPage: number) => void;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

export default function ProductList({
  products,
  total = 0,
  page = 1,
  pageSize = 10,
  onPageChange,
  loading,
  error = null,
  onRetry,
}: ProductListProps) {
  // When `products` prop is undefined, assume initial loading state
  const isLoading = loading ?? products === undefined;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  // ── Loading state ──────────────────────────────────────────────────────
  if (isLoading) {
    return <ProductSkeleton count={pageSize} />;
  }

  // ── Error state ────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertCircle className="mb-4 h-12 w-12 text-destructive" />
        <h3 className="mb-2 text-lg font-semibold">加载失败</h3>
        <p className="mb-6 text-sm text-muted-foreground">
          请稍后重试。
        </p>
        {onRetry && (
          <Button variant="outline" onClick={onRetry}>
            <RefreshCw className="mr-2 h-4 w-4" />
            重试
          </Button>
        )}
      </div>
    );
  }

  // ── Empty state ────────────────────────────────────────────────────────
  if (!products || products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <PackageOpen className="mb-4 h-12 w-12 text-muted-foreground" />
        <h3 className="mb-2 text-lg font-semibold">没有找到产品</h3>
        <p className="text-sm text-muted-foreground">
          请调整筛选条件后重试。
        </p>
      </div>
    );
  }

  // ── Data state ─────────────────────────────────────────────────────────
  return (
    <div className="space-y-8">
      {/* Product grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {products.map((product) => (
          <ProductCard
            key={product.sku}
            sku={product.sku}
            name={product.name}
            description={product.description}
            price={product.price}
            images={product.images}
            specs={product.specs}
          />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => onPageChange?.(page - 1)}
            aria-label="上一页"
          >
            上一页
          </Button>

          <span className="text-sm text-muted-foreground">
            第 {page} 页，共 {total} 条
          </span>

          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => onPageChange?.(page + 1)}
            aria-label="下一页"
          >
            下一页
          </Button>
        </div>
      )}
    </div>
  );
}
