"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import {
  MedalFirstPlaceIcon,
  BookOpen02Icon,
  CheckmarkCircle01Icon,
} from "@hugeicons/core-free-icons";
import { Badge } from "@/components/ui/badge";

export type QuizResultItem = {
  id: string;
  student_id: string;
  student_name: string | null;
  quiz_id: string;
  quiz_title: string | null;
  subject: string | null;
  score: number;
  correct_count: number;
  total_questions: number;
  nilai: number;
  created_at: string;
};

function nilaColor(nilai: number): string {
  if (nilai >= 90) return "text-emerald-600";
  if (nilai >= 75) return "text-blue-700";
  if (nilai >= 60) return "text-amber-600";
  return "text-red-600";
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

export function QuizResultsTable({ results }: { results: QuizResultItem[] }) {
  if (results.length === 0) {
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
    <div className="flex flex-col gap-3">
      {results.map((r) => (
        <div
          key={r.id}
          className="flex flex-col gap-3 rounded-3xl bg-white p-4 shadow-xs ring-1 ring-slate-200 sm:flex-row sm:items-center sm:gap-4"
        >
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-extrabold text-slate-900">
              {r.student_name ?? "Siswa"}
            </p>
            <p className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-slate-500">
              <HugeiconsIcon icon={BookOpen02Icon} size={13} strokeWidth={2} className="shrink-0" />
              <span className="truncate">{r.quiz_title ?? "Kuis"}</span>
              {r.subject ? (
                <Badge className="hidden shrink-0 border-0 bg-slate-100 text-slate-600 hover:bg-slate-100 sm:inline-flex">
                  {r.subject}
                </Badge>
              ) : null}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <div className="text-left sm:text-right">
              <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Nilai</p>
              <p className={`text-2xl leading-tight font-extrabold tabular-nums ${nilaColor(r.nilai)}`}>
                {r.nilai}
              </p>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Poin</p>
              <p className="text-lg leading-tight font-extrabold text-blue-700 tabular-nums">
                {r.score.toLocaleString("id-ID")}
              </p>
            </div>
            <div className="hidden text-right sm:block">
              <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Benar</p>
              <p className="text-sm font-bold text-slate-700 tabular-nums">
                {r.correct_count}/{r.total_questions}
              </p>
            </div>
            <div className="hidden text-right md:block">
              <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Tanggal</p>
              <p className="text-xs font-semibold text-slate-600">{formatDate(r.created_at)}</p>
            </div>
            <div className="hidden sm:flex sm:items-center sm:gap-2">
              <Badge
                className={`flex items-center gap-1 border-0 font-extrabold tabular-nums ${
                  r.correct_count === r.total_questions
                    ? "bg-amber-100 text-amber-800 hover:bg-amber-100"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-100"
                }`}
              >
                <HugeiconsIcon
                  icon={r.correct_count === r.total_questions ? MedalFirstPlaceIcon : CheckmarkCircle01Icon}
                  size={13}
                  strokeWidth={2}
                />
                {r.correct_count === r.total_questions
                  ? "Sempurna"
                  : `${r.correct_count} benar`}
              </Badge>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}