import { cn } from "@/utils/helpers";

interface SkeletonProps {
  className?: string;
  rounded?: "sm" | "md" | "lg" | "xl" | "full";
}

export function Skeleton({ className, rounded = "md" }: SkeletonProps) {
  const roundedMap = { sm: "rounded", md: "rounded-lg", lg: "rounded-xl", xl: "rounded-2xl", full: "rounded-full" };
  return (
    <div className={cn("skeleton", roundedMap[rounded], className)} />
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-neutral-100">
      <Skeleton className="w-full h-56" rounded="sm" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <div className="flex items-center justify-between pt-1">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-9 w-20" rounded="xl" />
        </div>
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function OrderCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl p-5 border border-neutral-100 space-y-4">
      <div className="flex justify-between">
        <Skeleton className="h-5 w-36" />
        <Skeleton className="h-5 w-20" rounded="full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
      <div className="flex justify-between pt-2">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-9 w-28" rounded="xl" />
      </div>
    </div>
  );
}
