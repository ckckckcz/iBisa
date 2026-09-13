"use client";

import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { pageNums } from "@/hooks/use-member-table";

export function MemberTablePagination({
  total, page, pages, perPage, setPage, setPerPage,
}: {
  total: number; page: number; pages: number; perPage: number;
  setPage: (n: number) => void; setPerPage: (n: number) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
      <span>Showing {total === 0 ? 0 : (page - 1) * perPage + 1}-{Math.min(page * perPage, total)} of {total}</span>
      <div className="ml-auto flex items-center gap-2">
        <span>Rows per page</span>
        <Select value={String(perPage)} onValueChange={(v) => setPerPage(Number(v ?? 10))}>
          <SelectTrigger className="w-20"><SelectValue /></SelectTrigger>
          <SelectContent>
            {[10, 20, 50].map((n) => (<SelectItem key={n} value={String(n)}>{n}</SelectItem>))}
          </SelectContent>
        </Select>
        <Button variant="outline" size="icon-sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>‹</Button>
        {pageNums(page, pages).map((n, i) => n === "…" ? (<span key={`e${i}`} className="px-1">…</span>) : (
          <Button key={n} size="icon-sm" variant={n === page ? "default" : "outline"} onClick={() => setPage(n)}> {n} </Button>
        ))}
        <Button variant="outline" size="icon-sm" disabled={page >= pages} onClick={() => setPage(page + 1)}>›</Button>
      </div>
    </div>
  );
}
