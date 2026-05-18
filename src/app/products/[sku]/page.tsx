import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { FileText, Download, ArrowLeft, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { Metadata } from "next";

interface ProductDetailPageProps {
  params: { sku: string };
}

async function getProduct(sku: string) {
  return prisma.product.findUnique({
    where: { sku },
    include: { category: true, brand: true, documents: true },
  });
}

export async function generateMetadata({
  params,
}: ProductDetailPageProps): Promise<Metadata> {
  const { sku } = params;
  const product = await getProduct(sku);

  if (!product) {
    return { title: "Product Not Found" };
  }

  return {
    title: product.name,
    description: product.description || `Elevator component ${product.sku}`,
    openGraph: {
      title: product.name,
      description: product.description || `Elevator component ${product.sku}`,
    },
  };
}

export default async function ProductDetailPage({
  params,
}: ProductDetailPageProps) {
  const { sku } = params;

  if (!sku) notFound();

  let product: any = null;
  let fetchError: string | null = null;

  try {
    product = await getProduct(sku);
  } catch (err) {
    fetchError = err instanceof Error ? err.message : "加载产品信息失败";
  }

  if (!product && !fetchError) {
    notFound();
  }

  // Error state
  if (fetchError) {
    return (
      <div className="container mx-auto px-4 py-20">
        <div className="flex flex-col items-center justify-center text-center">
          <AlertCircle className="mb-4 h-12 w-12 text-destructive" />
          <h2 className="mb-2 text-xl font-semibold">加载失败</h2>
          <p className="mb-6 text-sm text-muted-foreground">获取产品详情时出错了，请稍后重试。</p>
          <div className="flex gap-3">
            <Button variant="outline" asChild>
              <Link href="/products"><ArrowLeft className="mr-2 h-4 w-4" />返回列表</Link>
            </Button>
            <Button asChild>
              <a href={`/products/${sku}`}><RefreshCw className="mr-2 h-4 w-4" />重试</a>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Link href="/products" className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" />
        返回产品列表
      </Link>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Images */}
        <div className="space-y-4">
          {product.images && product.images.length > 0 ? (
            <div className="overflow-hidden rounded-lg border bg-muted">
              <img src={product.images[0]} alt={product.name} className="h-full w-full object-cover" />
            </div>
          ) : (
            <div className="flex aspect-square items-center justify-center rounded-lg border bg-muted">
              <span className="text-muted-foreground">暂无图片</span>
            </div>
          )}
          {product.images && product.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto">
              {product.images.map((img: string, i: number) => (
                <div key={i} className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-md border bg-muted">
                  <img src={img} alt={`${product.name} ${i + 1}`} className="h-full w-full object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div className="space-y-6">
          <div>
            <Badge variant="secondary" className="mb-2 font-mono">{product.sku}</Badge>
            <h1 className="text-3xl font-bold tracking-tight">{product.name}</h1>
          </div>

          <div className="flex flex-wrap gap-4 text-sm">
            {product.category && (
              <div>
                <span className="text-muted-foreground">分类：</span>
                <Link href={`/products?category=${product.category.slug}`} className="font-medium underline underline-offset-2 hover:text-primary">
                  {product.category.name}
                </Link>
              </div>
            )}
            {product.brand && (
              <div>
                <span className="text-muted-foreground">品牌：</span>
                <Link href={`/products?brand=${product.brand.slug}`} className="font-medium underline underline-offset-2 hover:text-primary">
                  {product.brand.name}
                </Link>
              </div>
            )}
          </div>

          <Separator />

          {product.description && (
            <div>
              <h2 className="mb-2 text-lg font-semibold">描述</h2>
              <p className="text-muted-foreground">{product.description}</p>
            </div>
          )}

          <Separator />

          {product.specs && Object.keys(product.specs).length > 0 && (
            <div>
              <h2 className="mb-3 text-lg font-semibold">规格</h2>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(product.specs).map(([key, val]) => (
                  <div key={key} className="flex justify-between rounded-md bg-muted/50 px-3 py-2 text-sm">
                    <span className="text-muted-foreground">{key}</span>
                    <span className="font-medium">{String(val)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Separator />

          <div>
            <h2 className="mb-2 text-lg font-semibold">价格</h2>
            <Link href="/login" className="text-sm text-muted-foreground underline underline-offset-2 hover:text-primary transition-colors">
              登录后查看价格
            </Link>
          </div>
        </div>
      </div>

      {/* Documents */}
      {product.documents && product.documents.length > 0 && (
        <div className="mt-12">
          <Separator className="mb-6" />
          <h2 className="mb-4 text-xl font-semibold">产品文档</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {product.documents.map((doc: any) => (
              <Card key={doc.id}>
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <Badge variant="outline" className="mb-1 text-xs">{doc.type}</Badge>
                    <p className="truncate text-sm font-medium">{doc.name}</p>
                  </div>
                  <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer"
                    className="flex h-9 w-9 items-center justify-center rounded-md border hover:bg-muted transition-colors"
                    aria-label={`下载 ${doc.name}`}>
                    <Download className="h-4 w-4" />
                  </a>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
