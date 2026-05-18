"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ProductCardProps {
  sku: string;
  name: string;
  description?: string;
  price: number | null;
  images: string[];
  specs?: Record<string, unknown> | null;
  isAuthenticated?: boolean;
  onAddToCart?: (sku: string) => void;
}

const FALLBACK_IMAGE = "https://placehold.co/600x400?text=No+Image";

export default function ProductCard({
  sku,
  name,
  description,
  price,
  images,
  specs,
  isAuthenticated = false,
  onAddToCart,
}: ProductCardProps) {
  const [imgSrc, setImgSrc] = useState(
    images.length > 0 ? images[0] : FALLBACK_IMAGE
  );
  const [imgError, setImgError] = useState(false);

  const handleImageError = () => {
    if (!imgError) {
      setImgError(true);
      setImgSrc(FALLBACK_IMAGE);
    }
  };

  return (
    <Card data-testid="product-card" className="group overflow-hidden">
      {/* Entire card clickable via this wrapper Link */}
      <Link href={`/products/${sku}`} className="block">
        {/* Image */}
        <div className="relative aspect-square w-full overflow-hidden bg-muted">
          <img
            src={imgSrc}
            alt={name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={handleImageError}
          />
        </div>
      </Link>

      <CardContent className="space-y-2 p-4">
        {/* SKU badge */}
        <Badge variant="secondary" className="text-xs font-mono">
          {sku}
        </Badge>

        {/* Name (text only — link already wraps the whole card) */}
        <h3 className="font-semibold leading-tight line-clamp-2">{name}</h3>

        {/* Description */}
        {description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {description}
          </p>
        )}

        {/* Specs chips */}
        {specs && Object.keys(specs).length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {Object.entries(specs).map(([key, val]) => (
              <Badge key={key} variant="outline" className="text-xs">
                {key}: {String(val)}
              </Badge>
            ))}
          </div>
        )}

        {/* Price / Auth gate */}
        <div className="pt-2">
          {isAuthenticated && price !== null ? (
            <span className="text-lg font-bold text-primary">
              ${price.toFixed(2)}
            </span>
          ) : (
            <Link
              href="/login"
              className="text-sm text-muted-foreground underline underline-offset-2 hover:text-primary transition-colors"
            >
              登录后查看价格
            </Link>
          )}
        </div>

        {/* Add to Quotation Cart (authenticated only) */}
        {isAuthenticated && onAddToCart && (
          <Button
            size="sm"
            className="mt-2 w-full"
            onClick={(e) => {
              e.preventDefault();
              onAddToCart(sku);
            }}
          >
            加入报价车
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
