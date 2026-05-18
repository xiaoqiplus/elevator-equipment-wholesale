interface ProductSkeletonProps {
  count?: number;
}

export default function ProductSkeleton({ count = 10 }: ProductSkeletonProps) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          data-testid="product-skeleton"
          className="animate-pulse rounded-lg border bg-card"
        >
          {/* Image placeholder */}
          <div className="aspect-square w-full rounded-t-lg bg-muted" />
          {/* Content placeholders */}
          <div className="space-y-3 p-4">
            <div className="h-4 w-3/4 rounded bg-muted" />
            <div className="h-3 w-1/2 rounded bg-muted" />
            <div className="h-3 w-full rounded bg-muted" />
            <div className="flex gap-2 pt-2">
              <div className="h-8 w-20 rounded bg-muted" />
              <div className="h-8 w-24 rounded bg-muted" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
