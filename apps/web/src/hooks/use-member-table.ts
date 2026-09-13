import { useMemo, useState } from "react";
import { getMemberVal, type Column, type FilterDef, type Member } from "@/types/school";

export function useMemberTable({
  rows, columns, searchKeys, filters,
}: {
  rows: Member[];
  columns: Column[];
  searchKeys: (keyof Member)[];
  filters: FilterDef[];
}) {
  const [q, setQ] = useState("");
  const [fVals, setFVals] = useState<Record<string, string>>({});
  const [sortKey, setSortKey] = useState("");
  const [sortDir, setSortDir] = useState<1 | -1>(1);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [sel, setSel] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    let out = rows.filter((m) => {
      if (needle && !searchKeys.some((k) => (m[k] ?? "").toString().toLowerCase().includes(needle))) return false;
      for (const f of filters) {
        const v = fVals[f.key];
        if (v && getMemberVal(m, f.key) !== v.toLowerCase()) return false;
      }
      return true;
    });
    if (sortKey) out = [...out].sort((a, b) => getMemberVal(a, sortKey).localeCompare(getMemberVal(b, sortKey)) * sortDir);
    return out;
  }, [rows, q, fVals, sortKey, sortDir, searchKeys, filters]);

  const pages = Math.max(1, Math.ceil(filtered.length / perPage));
  const cur = Math.min(page, pages);
  const pageRows = filtered.slice((cur - 1) * perPage, cur * perPage);
  const allSel = pageRows.length > 0 && pageRows.every((r) => sel.has(r.id));

  function toggleSort(key: string) {
    if (sortKey !== key) { setSortKey(key); setSortDir(1); }
    else setSortDir((d) => (d === 1 ? -1 : 1));
  }

  function toggleRow(id: string, v: boolean) {
    const n = new Set(sel);
    if (v) n.add(id); else n.delete(id);
    setSel(n);
  }

  function togglePage(v: boolean) {
    const n = new Set(sel);
    if (v) pageRows.forEach((r) => n.add(r.id)); else pageRows.forEach((r) => n.delete(r.id));
    setSel(n);
  }

  function exportCsv(exportName: string) {
    const data = sel.size > 0 ? filtered.filter((r) => sel.has(r.id)) : filtered;
    const head = columns.map((c) => c.label).join(",");
    const lines = data.map((m) => columns.map((c) => `"${getMemberVal(m, c.key).replace(/"/g, '""')}"`).join(","));
    const blob = new Blob([[head, ...lines].join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${exportName}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function reset() {
    setQ(""); setFVals({}); setPage(1); setSortKey("");
  }

  return {
    q, setQ: (v: string) => { setQ(v); setPage(1); },
    fVals, setFilter: (k: string, v: string) => { setFVals((p) => ({ ...p, [k]: v })); setPage(1); },
    sortKey, sortDir, toggleSort, page: cur, setPage, perPage,
    setPerPage: (n: number) => { setPerPage(n); setPage(1); },
    sel, toggleRow, togglePage, allSel,
    filtered, pages, pageRows, exportCsv, reset,
  };
}

export function pageNums(cur: number, pages: number): (number | "…")[] {
  if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1);
  if (cur <= 3) return [1, 2, 3, "…", pages - 1, pages];
  if (cur >= pages - 2) return [1, 2, "…", pages - 2, pages - 1, pages];
  return [1, "…", cur - 1, cur, cur + 1, "…", pages];
}
