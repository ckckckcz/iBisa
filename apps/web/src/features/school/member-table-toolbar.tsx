"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { FilterDef } from "@/types/school";

export function MemberTableToolbar({
  q, setQ, fVals, setFilter, filters, searchPlaceholder, onReset, onExport,
}: {
  q: string; setQ: (v: string) => void;
  fVals: Record<string, string>; setFilter: (k: string, v: string) => void;
  filters: FilterDef[]; searchPlaceholder: string; onReset: () => void; onExport: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative">
        <Input placeholder={searchPlaceholder} value={q} onChange={(e) => setQ(e.target.value)} className="w-56 pl-8" />
        <span className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-muted-foreground">⌕</span>
      </div>
      {filters.map((f) => (
        <Select key={f.key} value={fVals[f.key] ?? ""} onValueChange={(v) => setFilter(f.key, !v || v === "__all" ? "" : v)}>
          <SelectTrigger className="w-32"><SelectValue placeholder={f.label} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__all">All</SelectItem>
            {f.options.map((o) => (<SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>))}
          </SelectContent>
        </Select>
      ))}
      <Button variant="ghost" size="sm" onClick={onReset}>Reset Filters</Button>
      <div className="ml-auto flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onExport}>Export</Button>
      </div>
    </div>
  );
}
