"use client";

import { useEffect, useMemo, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { HugeiconsIcon } from "@hugeicons/react";
import { BookOpen02Icon } from "@hugeicons/core-free-icons";
import { StatusBadge } from "@/features/school/member-badges";
import { TablePagination } from "@/components/table-pagination";
import { initials } from "@/types/school";
import { formatDate, nilaColor, type QuizResultItem } from "./quiz-results-table";

export type ProfilStudent = {
  id: string;
  full_name: string;
  avatar_url?: string | null;
  class_id?: string | null;
  status?: string;
  attendance_pct?: number;
};

type StudentProgress = {
  student: ProfilStudent;
  attemptedQuizzes: number;
  bestNilai: number | null;
  avgNilai: number | null;
  poin: number;
  lastActive: string | null;
};

function toProgress(students: ProfilStudent[], results: QuizResultItem[]): StudentProgress[] {
  return students.map((s) => {
    const mine = results.filter((r) => r.student_id === s.id);
    const bestPerQuiz = new Map<string, QuizResultItem>();
    for (const r of mine) {
      const cur = bestPerQuiz.get(r.quiz_id);
      if (!cur || r.nilai > cur.nilai) bestPerQuiz.set(r.quiz_id, r);
    }
    const bests = [...bestPerQuiz.values()];
    const bestNilai = bests.length ? Math.max(...bests.map((b) => b.nilai)) : null;
    const avgNilai = bests.length
      ? Math.round((bests.reduce((acc, b) => acc + b.nilai, 0) / bests.length) * 10) / 10
      : null;
    let lastActive: string | null = null;
    for (const r of mine) {
      if (!lastActive || new Date(r.created_at).getTime() > new Date(lastActive).getTime()) {
        lastActive = r.created_at;
      }
    }
    return {
      student: s,
      attemptedQuizzes: bests.length,
      bestNilai,
      avgNilai,
      poin: bests.reduce((acc, b) => acc + b.score, 0),
      lastActive,
    };
  });
}

export function ProfilSiswaTab({
  students,
  classMap,
  totalQuizzes,
  results,
  emptyHeading = "Belum ada siswa di kelas binaan",
  emptyHint = "Tetapkan kelas binaan atau wali kelas di menu Guru (> Edit Guru) agar siswa muncul di sini.",
}: {
  students: ProfilStudent[] | undefined;
  classMap: Record<string, string>;
  totalQuizzes: number;
  results: QuizResultItem[] | null;
  emptyHeading?: string;
  emptyHint?: string;
}) {
  const progresses = useMemo(() => toProgress(students ?? [], results ?? []), [students, results]);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => setPageIndex(0), [students, results]);

  const pageCount = Math.max(1, Math.ceil(progresses.length / pageSize));
  const safePageIndex = Math.min(pageIndex, pageCount - 1);
  const visible = progresses.slice(safePageIndex * pageSize, safePageIndex * pageSize + pageSize);

  if (!students || students.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-3xl border border-dashed border-slate-300 bg-white/60 px-6 py-12 text-center">
        <HugeiconsIcon icon={BookOpen02Icon} strokeWidth={2} className="size-8 text-slate-300" />
        <p className="text-sm font-bold text-slate-600">{emptyHeading}</p>
        <p className="max-w-sm text-xs text-slate-500">{emptyHint}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="overflow-hidden rounded-lg border bg-card">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-muted">
            <TableRow>
              <TableHead>Siswa</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Kuis Dikerjakan</TableHead>
              <TableHead className="text-right">Nilai Terbaik</TableHead>
              <TableHead className="text-right">Rata-rata</TableHead>
              <TableHead className="text-right">Poin</TableHead>
              <TableHead className="text-right">Terakhir Aktif</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="**:data-[slot=table-cell]:first:w-8">
            {visible.map((p) => (
            <TableRow key={p.student.id} className="hover:bg-muted/50">
              <TableCell>
                <div className="flex items-center gap-2.5">
                  <Avatar className="size-8">
                    <AvatarImage src={p.student.avatar_url ?? undefined} alt={p.student.full_name} />
                    <AvatarFallback>{initials(p.student.full_name)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{p.student.full_name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {p.student.class_id ? classMap[p.student.class_id] ?? "Kelas lain" : "Tanpa kelas"}
                    </p>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <StatusBadge s={(p.student.status as "active" | "on_leave" | "inactive") ?? "active"} />
              </TableCell>
              <TableCell className="text-right tabular-nums">
                <span className="font-semibold">
                  {p.attemptedQuizzes}/{totalQuizzes}
                </span>
              </TableCell>
              <TableCell className="text-right">
                {p.bestNilai !== null ? (
                  <span className={`font-extrabold tabular-nums ${nilaColor(p.bestNilai)}`}>
                    {p.bestNilai}
                  </span>
                ) : (
                  <Badge className="border-0 bg-slate-100 text-slate-600 hover:bg-slate-100">
                    Belum
                  </Badge>
                )}
              </TableCell>
              <TableCell className="text-right tabular-nums text-muted-foreground">
                {p.avgNilai !== null ? p.avgNilai : "–"}
              </TableCell>
              <TableCell className="text-right">
                <span className="font-bold text-blue-700 tabular-nums">
                  {p.poin.toLocaleString("id-ID")}
                </span>
              </TableCell>
              <TableCell className="text-right text-sm text-muted-foreground">
                {p.lastActive ? formatDate(p.lastActive) : "–"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      </div>
      <TablePagination
        pageIndex={safePageIndex}
        pageCount={pageCount}
        pageSize={pageSize}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setPageIndex(0);
        }}
        onPageChange={setPageIndex}
      />
    </div>
  );
}