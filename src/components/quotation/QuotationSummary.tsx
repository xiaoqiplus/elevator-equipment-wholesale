"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Send } from "lucide-react";

interface QuotationSummaryProps {
  itemCount: number;
  totalItems: number;
  totalPrice: number;
  onSubmit?: () => void;
  isSubmitting?: boolean;
}

export default function QuotationSummary({
  itemCount,
  totalItems,
  totalPrice,
  onSubmit,
  isSubmitting = false,
}: QuotationSummaryProps) {
  return (
    <Card className="sticky bottom-0 border-t bg-background shadow-lg">
      <CardContent className="flex items-center justify-between p-4">
        <div className="space-y-0.5 text-sm text-muted-foreground">
          <p>
            共 <span className="font-semibold text-foreground">{itemCount}</span> 件
          </p>
          <p>
            <span className="font-semibold text-foreground">{totalItems}</span> 种产品
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm text-muted-foreground">总计</p>
            <p className="text-2xl font-bold text-primary">
              ${totalPrice.toFixed(2)}
            </p>
          </div>

          <Button
            size="lg"
            onClick={onSubmit}
            disabled={isSubmitting || itemCount === 0}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                提交中…
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                提交报价
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
