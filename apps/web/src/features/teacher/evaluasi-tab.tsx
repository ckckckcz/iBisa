"use client";

import { useEffect, useMemo, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowDown01Icon, BookOpen02Icon } from "@hugeicons/core-free-icons";
import { TablePagination } from "@/components/table-pagination";
import { formatDate, nilaColor, type QuizResultItem } from "./quiz-results-table";

export type StudentQuizGroup = {
  studentId: string;
  studentName: string;
  quizId: string;
  quizTitle: string;
  subject: string | null;
  attempts: QuizResultItem[];
  best: QuizResultItem;
};

export function aggregateBestPerQuiz(results: QuizResultItem[]): StudentQuizGroup[] {
  const map = new Map<string, QuizResultItem[]>();
  for (const r of results) {
    const key = `${r.student_id}::${r.quiz_id}`;
    const list = map.get(key) ?? [];
    list.push(r);
    map.set(key, list);
  }

  const groups: StudentQuizGroup[] = [];
  for (const list of map.values()) {
    const attempts = [...list].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
    const best = attempts.reduce((acc, cur) => (cur.nilai > acc.nilai ? cur : acc));
    groups.push({
      studentId: attempts[0].student_id,
      studentName: attempts[0].student_name ?? "Siswa",
      quizId: attempts[0].quiz_id,
      quizTitle: attempts[0].quiz_title ?? "Kuis",
      subject: attempts[0].subject,
      attempts,
      best,
    });
  }

  groups.sort((a, b) => a.studentName.localeCompare(b.studentName, "id"));
  return groups;
}

function EvalRow({ group }: { group: StudentQuizGroup }) {
  const [open, setOpen] = useState(false);
  const { best, attempts } = group;
  const earlier = attempts.filter((a) => a.id !== best.id);

  return (
    <>
      <TableRow className="hover:bg-muted/50">
        <TableCell>
          <p className="font-medium text-foreground">{group.studentName}</p>
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-1.5">
            <span className="mr-2 line-clamp-1">{group.quizTitle}</span>
            {group.subject ? (
              <Badge className="hidden shrink-0 border-0 bg-slate-100 text-slate-600 hover:bg-slate-100 sm:inline-flex">
                {group.subject}
              </Badge>
            ) : null}
          </div>
        </TableCell>
        <TableCell className="text-right tabular-nums">
          {attempts.length}×
        </TableCell>
        <TableCell className="text-right">
          <span className={`text-lg font-extrabold tabular-nums ${nilaColor(best.nilai)}`}>
            {best.nilai}
          </span>
        </TableCell>
        <TableCell className="text-right">
          <span className="font-bold text-blue-700 tabular-nums">
            {best.score.toLocaleString("id-ID")}
          </span>
        </TableCell>
        <TableCell className="w-10 text-right">
          <button
            type="button"
            aria-label={open ? "Tutup riwayat nilai" : "Lihat nilai terdahulu"}
            className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
            onClick={() => setOpen((v) => !v)}
          >
            <HugeiconsIcon
              icon={ArrowDown01Icon}
              strokeWidth={2}
              className={`size-4 transition-transform ${open ? "rotate-180" : ""}`}
            />
          </button>
        </TableCell>
      </TableRow>
      {open ? (
        <TableRow className="bg-muted/30">
          <TableCell colSpan={6} className="px-4 py-3">
            <div className="flex flex-col gap-2">
              <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                Riwayat percobaan ({attempts.length}×)
              </p>
              {earlier.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  Percobaan pertama — belum ada nilai terdahulu.
                </p>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {attempts.map((a, i) => {
                    const isBest = a.id === best.id;
                    return (
                      <div
                        key={a.id}
                        className={`flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg px-2 py-1.5 text-sm ${
                          isBest ? "bg-emerald-50 text-emerald-900" : "bg-white text-slate-600"
                        }`}
                      >
                        <span className="font-semibold">Percobaan ke-{i + 1}</span>
                        {isBest ? <Badge className="border-0 bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Terbaik</Badge> : null}
                        <span className={`font-extrabold tabular-nums ${nilaColor(a.nilai)}`}>
                          Nilai {a.nilai}
                        </span>
                        <span className="tabular-nums">
                          {a.correct_count}/{a.total_questions} benar
                        </span>
                        <span className="font-semibold text-blue-700 tabular-nums">
                          {a.score.toLocaleString("id-ID")} poin
                        </span>
                        <span className="ml-auto text-xs text-slate-400">
                          {formatDate(a.created_at)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </TableCell>
        </TableRow>
      ) : null}
    </>
  );
}

export function EvaluasiTab({ results }: { results: QuizResultItem[] | null }) {
  const groups = useMemo(() => aggregateBestPerQuiz(results ?? []), [results]);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => setPageIndex(0), [results]);

  const pageCount = Math.max(1, Math.ceil(groups.length / pageSize));
  const safePageIndex = Math.min(pageIndex, pageCount - 1);
  const visible = groups.slice(safePageIndex * pageSize, safePageIndex * pageSize + pageSize);

  if (results === null) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-300 bg-white/60 px-6 py-12 text-center text-sm text-slate-500">
        Memuat hasil kuis…
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-3xl border border-dashed border-slate-300 bg-white/60 px-6 py-12 text-center">
        <HugeiconsIcon icon={BookOpen02Icon} strokeWidth={2} className="size-8 text-slate-300" />
        <p className="text-sm font-bold text-slate-600">Belum ada hasil kuis</p>
        <p className="max-w-sm text-xs text-slate-500">
          Hasil kuis siswa akan muncul di sini setelah mereka menyelesaikan sebuah kuis.
        </p>
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
              <TableHead>Modul / Kuis</TableHead>
              <TableHead className="w-24 text-right">Percobaan</TableHead>
              <TableHead className="w-28 text-right">Nilai Terbaik</TableHead>
              <TableHead className="w-28 text-right">Poin</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody className="**:data-[slot=table-cell]:first:w-8">
            {visible.map((g) => (
              <EvalRow key={`${g.studentId}::${g.quizId}`} group={g} />
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