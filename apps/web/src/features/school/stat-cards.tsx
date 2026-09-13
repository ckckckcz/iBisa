import { Card, CardContent } from "@/components/ui/card";
import { HugeiconsIcon, type HugeiconsIconProps } from "@hugeicons/react";

export type StatItem = {
  label: string; value: string; sub: string; delta?: string; down?: boolean;
  icon: HugeiconsIconProps["icon"];
};

export function StatCards({ items }: { items: StatItem[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      {items.map((s) => (
        <Card key={s.label}>
          <CardContent className="flex flex-col gap-1 p-4">
            <div className="flex items-center gap-2">
              <span className="grid size-6 place-items-center rounded-md bg-blue-700 text-white">
                <HugeiconsIcon icon={s.icon} strokeWidth={2} className="size-3.5" />
              </span>
              <span className="text-xs font-medium text-muted-foreground">{s.label}</span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-semibold tracking-tight">{s.value}</span>
              {s.delta && (
                <span className={`rounded-full px-1.5 py-0.5 text-[11px] font-medium ${s.down ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600"}`}>
                  {s.down ? "↓" : "↑"}{s.delta}
                </span>
              )}
            </div>
            <span className="text-xs text-muted-foreground">{s.sub}</span>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
