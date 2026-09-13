"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { Column, FilterDef, Member } from "@/types/school";
import { useMemberTable } from "@/hooks/use-member-table";
import { MemberTableToolbar } from "./member-table-toolbar";
import { MemberTablePagination } from "./member-table-pagination";

export function MemberTable({
  rows, columns, searchPlaceholder, searchKeys, filters, exportName, onEdit, onDelete,
}: {
  rows: Member[];
  columns: Column[];
  searchPlaceholder: string;
  searchKeys: (keyof Member)[];
  filters: FilterDef[];
  exportName: string;
  onEdit?: (m: Member) => void;
  onDelete?: (m: Member) => void;
}) {
  const t = useMemberTable({ rows, columns, searchKeys, filters });
  const hasActions = !!onEdit || !!onDelete;

  return (
    <div className="flex flex-col gap-3">
      <MemberTableToolbar
        q={t.q} setQ={t.setQ} fVals={t.fVals} setFilter={t.setFilter}
        filters={filters} searchPlaceholder={searchPlaceholder}
        onReset={t.reset} onExport={() => t.exportCsv(exportName)}
      />

      <div className="overflow-hidden rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox checked={t.allSel} onCheckedChange={(v) => t.togglePage(!!v)} aria-label="Select all" />
              </TableHead>
              {columns.map((c) => (
                <TableHead key={c.key}>
                  {c.sortable ? (
                    <button className="inline-flex items-center gap-1 hover:text-foreground" onClick={() => t.toggleSort(c.key)}>
                      {c.label}<span className="text-muted-foreground">⇅</span>
                    </button>
                  ) : c.label}
                </TableHead>
              ))}
              {hasActions && <TableHead className="text-right">Action</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {t.pageRows.map((m) => (
              <TableRow key={m.id}>
                <TableCell>
                  <Checkbox checked={t.sel.has(m.id)} onCheckedChange={(v) => t.toggleRow(m.id, !!v)} aria-label="Select row" />
                </TableCell>
                {columns.map((c) => (<TableCell key={c.key}>{c.render(m)}</TableCell>))}
                {hasActions && (
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm">···</Button>} />
                      <DropdownMenuContent align="end">
                        {onEdit && <DropdownMenuItem onClick={() => onEdit(m)}>Edit</DropdownMenuItem>}
                        {onDelete && <DropdownMenuItem onClick={() => onDelete(m)}>Hapus</DropdownMenuItem>}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                )}
              </TableRow>
            ))}
            {t.pageRows.length === 0 && (<TableRow><TableCell colSpan={columns.length + (hasActions ? 2 : 1)} className="py-8 text-center text-muted-foreground">Belum ada data</TableCell></TableRow>)}
          </TableBody>
        </Table>
      </div>

      <MemberTablePagination
        total={t.filtered.length} page={t.page} pages={t.pages}
        perPage={t.perPage} setPage={t.setPage} setPerPage={t.setPerPage}
      />
    </div>
  );
}
