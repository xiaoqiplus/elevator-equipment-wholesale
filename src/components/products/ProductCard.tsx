"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ProductCardProps {
  sku: string;
  name: string;
  description?: string;
  images: string[];
  specs?: Record<string, unknown> | null;
  category?: { name: string; slug: string } | null;
  brand?: { name: string; slug: string } | null;
}

const FALLBACK_IMAGE = "https://placehold.co/600x400?text=No+Image";

export default function ProductCard({ sku, name, description, images, specs, category, brand }: ProductCardProps) {
  const [imgSrc, setImgSrc] = useState(images.length > 0 ? images[0] : FALLBACK_IMAGE);
  const [imgError, setImgError] = useState(false);

  return (
    <Card data-testid="product-card" className="group overflow-hidden">
      <Link href={`/products/${sku}`} className="block">
        <div className="relative aspect-square w-full overflow-hidden bg-muted">
          <img
            src={imgError || images.length === 0 ? FALLBACK_IMAGE : imgSrc}
            alt={name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={() => { setImgError(true); setImgSrc(FALLBACK_IMAGE); }}
          />
        </div>
      </Link>

      <CardContent className="space-y-2 p-4">
        <Badge variant="secondary" className="text-xs font-mono">{sku}</Badge>
        <h3 className="font-semibold leading-tight line-clamp-2">{name}</h3>
        {description && (
          <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>
        )}
        <div className="flex flex-wrap gap-1.5 pt-1 text-xs text-slate-400">
          {category && <span>{category.name}</span>}
          {brand && <span>{brand.name}</span>}
        </div>
      </CardContent>
    </Card>
  );
}
