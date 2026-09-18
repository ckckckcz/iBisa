import { Skeleton } from "@/components/ui/skeleton";

export function QuizDetailSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-hidden rounded-lg border bg-white shadow-sm p-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        <div className="mt-2 flex items-center gap-2">
          <Skeleton className="h-3 w-12" />
          <Skeleton className="h-3 w-10" />
          <Skeleton className="h-3 w-12" />
        </div>
        <div className="mt-4 flex items-center gap-2">
          <Skeleton className="h-7 w-24 rounded" />
          <Skeleton className="h-7 w-28 rounded border border-neutral-200" />
        </div>
      </div>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-lg border bg-white shadow-sm p-4">
          <div className="flex items-start gap-2">
            <Skeleton className="h-6 w-6 shrink-0 rounded-full" />
            <Skeleton className="h-4 flex-1" />
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {[0, 1, 2, 3].map((j) => (
              <Skeleton key={j} className="h-9 w-full rounded-md bg-neutral-100" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}