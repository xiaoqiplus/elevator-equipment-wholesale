"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Minus, Plus, Trash2 } from "lucide-react";

interface QuotationItemProps {
  sku: string;
  name: string;
  price: number;
  quantity: number;
  note?: string;
  image?: string;
  onQuantityChange?: (sku: string, quantity: number) => void;
  onRemove?: (sku: string) => void;
  onNoteChange?: (sku: string, note: string) => void;
}

export default function QuotationItem({
  sku,
  name,
  price,
  quantity,
  note = "",
  image,
  onQuantityChange,
  onRemove,
  onNoteChange,
}: QuotationItemProps) {
  const subtotal = price * quantity;

  return (
    <Card data-testid="quotation-item">
      <CardContent className="flex items-start gap-4 p-4">
        {/* Product image */}
        {image && (
          <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-md border bg-muted">
            <img
              src={image}
              alt={name}
              className="h-full w-full object-cover"
            />
          </div>
        )}

        {/* Info */}
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h4 className="font-semibold">{name}</h4>
              <Badge variant="secondary" className="mt-0.5 font-mono text-xs">
                {sku}
              </Badge>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">单价</p>
              <p className="font-semibold">${price.toFixed(2)}</p>
            </div>
          </div>

          {/* Quantity controls */}
          <div className="flex items-center gap-3 pt-2">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={quantity <= 1}
              onClick={() => onQuantityChange?.(sku, quantity - 1)}
              aria-label="减少"
            >
              <Minus className="h-3 w-3" />
            </Button>

            <span className="w-8 text-center text-sm font-medium">
              {quantity}
            </span>

            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => onQuantityChange?.(sku, quantity + 1)}
              aria-label="增加"
            >
              <Plus className="h-3 w-3" />
            </Button>

            <span className="ml-auto text-sm text-muted-foreground">
              小计：<span className="font-semibold text-foreground">${subtotal.toFixed(2)}</span>
            </span>

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive"
              onClick={() => onRemove?.(sku)}
              aria-label="删除"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          {/* Note */}
          <div className="pt-1">
            {note && (
              <p className="mb-1 text-xs text-muted-foreground">{note}</p>
            )}
            <Input
              placeholder="备注…"
              value={note}
              onChange={(e) => onNoteChange?.(sku, e.target.value)}
              className="h-8 text-sm"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
