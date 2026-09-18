import { Skeleton } from "@/components/ui/skeleton";

export function QuizGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex flex-col overflow-hidden rounded-lg border border-neutral-200 bg-white">
          <div className="border-b border-neutral-100 bg-neutral-50 px-3 py-2.5">
            <Skeleton className="h-4 w-3/4" />
            <div className="mt-2 flex items-center gap-2">
              <Skeleton className="h-3 w-14" />
              <Skeleton className="h-3 w-10" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
          <div className="flex flex-1 flex-col gap-2 px-3 py-3">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-16 rounded" />
              <Skeleton className="h-5 w-20 rounded border border-neutral-200" />
            </div>
            <div className="mt-1 space-y-1.5">
              <Skeleton className="h-7 w-full rounded bg-neutral-100" />
              <Skeleton className="h-7 w-full rounded bg-neutral-100" />
            </div>
            <div className="mt-auto flex gap-2 pt-2">
              <Skeleton className="h-7 flex-1 rounded-lg" />
              <Skeleton className="h-7 flex-1 rounded-lg" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}