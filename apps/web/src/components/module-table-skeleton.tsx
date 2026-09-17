import { Skeleton } from "@/components/ui/skeleton";

export function ModuleTableSkeleton() {
  const headers = ["", "Rencana", "Jenis", "Status", "Target", "Batas"];
  return (
    <div className="flex w-full flex-col justify-start gap-6">
      <div className="flex items-center justify-between px-4 lg:px-6">
        <Skeleton className="h-8 w-40" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-32" />
        </div>
      </div>
      <div className="flex flex-col gap-4 px-4 lg:px-6">
        <div className="overflow-hidden rounded-lg border bg-card">
          <div className="grid grid-cols-[3rem_1fr_1fr_1fr_1fr_1fr] items-center gap-4 border-b bg-muted px-4 py-2.5">
            {headers.map((h, i) => (
              <Skeleton key={i} className={`h-4 ${h ? "w-16" : "w-5"}`} />
            ))}
          </div>
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="grid grid-cols-[3rem_1fr_1fr_1fr_1fr_1fr] items-center gap-4 border-b px-4 py-3.5 last:border-b-0"
            >
              <Skeleton className="h-4 w-5" />
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-14" />
              <Skeleton className="h-4 w-14" />
              <Skeleton className="h-4 w-14" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}