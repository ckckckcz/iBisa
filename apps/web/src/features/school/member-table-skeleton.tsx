import { Skeleton } from "@/components/ui/skeleton";

export function MemberTableSkeleton({ cols = 5, rows = 6 }: { cols?: number; rows?: number }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Skeleton className="h-8 w-56" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-24" />
        </div>
      </div>
      <div className="overflow-hidden rounded-lg border bg-card">
        <div className="grid grid-cols-[3rem_1fr_1fr_1fr_1fr_3rem] items-center gap-4 border-b bg-muted px-4 py-2.5">
          {Array.from({ length: cols + 1 }).map((_, i) => (
            <Skeleton key={i} className={`h-4 ${i === 0 || i === cols ? "w-5 justify-self-center" : "w-16"}`} />
          ))}
        </div>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="grid grid-cols-[3rem_1fr_1fr_1fr_1fr_3rem] items-center gap-4 border-b px-4 py-3.5 last:border-b-0">
            <Skeleton className="h-4 w-4 justify-self-center" />
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-5 justify-self-end" />
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-40" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-7 w-20" />
          <Skeleton className="h-7 w-24" />
        </div>
      </div>
    </div>
  );
}