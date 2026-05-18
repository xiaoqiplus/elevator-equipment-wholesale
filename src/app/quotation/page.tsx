"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession, SessionProvider } from "next-auth/react";
import { useQuotationStore } from "@/store/quotationStore";
import QuotationItem from "@/components/quotation/QuotationItem";
import QuotationSummary from "@/components/quotation/QuotationSummary";
import { Button } from "@/components/ui/button";
import { ShoppingCart, ArrowLeft, CheckCircle2, AlertCircle } from "lucide-react";

function QuotationPageInner() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const isAuthenticated = status === "authenticated";

  const {
    items,
    removeItem,
    updateQuantity,
    clearItems,
    setItemNote,
    getItemCount,
    getTotalItems,
  } = useQuotationStore();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return null;
  }

  const itemCount = getItemCount();
  const totalItems = getTotalItems();
  const totalPrice = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch("/api/quotations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((item) => ({
            productId: item.sku,
            sku: item.sku,
            name: item.name,
            quantity: item.quantity,
            note: item.note ?? "",
          })),
        }),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      setSubmitSuccess(true);
      clearItems();
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "提交报价失败"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (items.length === 0 && !submitSuccess) {
    return (
      <div className="container mx-auto px-4 py-20">
        <div className="flex flex-col items-center justify-center text-center">
          <ShoppingCart className="mb-4 h-16 w-16 text-muted-foreground" />
          <h1 className="mb-2 text-2xl font-bold">报价车为空</h1>
          <p className="mb-6 text-muted-foreground">
            请先浏览产品目录，将产品加入报价车。
          </p>
          <Button asChild>
            <Link href="/products">
              <ArrowLeft className="mr-2 h-4 w-4" />
              浏览产品
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  if (submitSuccess) {
    return (
      <div className="container mx-auto px-4 py-20">
        <div className="flex flex-col items-center justify-center text-center">
          <CheckCircle2 className="mb-4 h-16 w-16 text-green-500" />
          <h1 className="mb-2 text-2xl font-bold">提交成功</h1>
          <p className="mb-6 text-muted-foreground">我们会尽快与您联系。</p>
          <Button asChild>
            <Link href="/products">继续浏览产品</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">报价车</h1>
        <span className="text-sm text-muted-foreground">
          共 {itemCount} 件
        </span>
      </div>

      {submitError && (
        <div className="mb-4 flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>提交失败：{submitError}</span>
        </div>
      )}

      <div className="space-y-4 pb-32">
        {items.map((item) => (
          <QuotationItem
            key={item.sku}
            sku={item.sku}
            name={item.name}
            price={item.price}
            quantity={item.quantity}
            note={item.note}
            image={item.image}
            onQuantityChange={updateQuantity}
            onRemove={removeItem}
            onNoteChange={setItemNote}
          />
        ))}
      </div>

      <QuotationSummary
        itemCount={itemCount}
        totalItems={totalItems}
        totalPrice={totalPrice}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}

export default function QuotationPage() {
  return (
    <SessionProvider>
      <QuotationPageInner />
    </SessionProvider>
  );
}
