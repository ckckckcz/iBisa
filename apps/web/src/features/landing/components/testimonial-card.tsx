import { Card, CardContent } from "@/components/ui/card";
import type { TestimonialItem } from "@/lib/types";

export function TestimonialCard({ quote, name, role, initials }: TestimonialItem) {
  return (
    <Card className="relative h-full w-80 cursor-pointer overflow-hidden border-neutral-200 bg-white shadow-none p-5">
      <CardContent className="p-0 flex flex-col gap-3">
        <div className="flex flex-row items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-blue-700 flex items-center justify-center shrink-0">
            <span className="text-white text-xs font-bold">{initials}</span>
          </div>
          <div className="flex flex-col">
            <p className="text-sm font-semibold text-neutral-900 leading-tight">{name}</p>
            <p className="text-xs font-medium text-neutral-500">{role}</p>
          </div>
        </div>
        <p className="text-sm leading-relaxed text-neutral-700">&ldquo;{quote}&rdquo;</p>
      </CardContent>
    </Card>
  );
}
