"use client";

import { useEffect, useMemo, useState } from "react";
import { ChartAreaInteractive } from "@/components/chart-area-interactive";
import { DataTable, type DataTableTab } from "@/components/data-table";
import { SectionCards } from "@/components/section-cards";
import { Badge } from "@/components/ui/badge";
import { getValidToken } from "@/lib/ai-helpers";
import { EvaluasiTab } from "@/features/teacher/evaluasi-tab";
import { ProfilSiswaTab } from "@/features/teacher/profil-siswa-tab";
import type { QuizResultItem } from "@/features/teacher/quiz-results-table";

type TeacherDashboard = {
  profile?: { id: string; full_name: string; subject?: string };
  classesTaught?: { id: string; name: string; tingkat: string }[];
  waliClasses?: { id: string; name: string; tingkat: string }[];
  students?: {
    id: string; full_name: string; grade?: string | null; status?: string;
    avatar_url?: string | null; class_id?: string | null;
  }[];
  stats?: {
    activeStudents: number;
    totalQuizzes: number;
    totalAttempts: number;
    engagementPct: number;
    needsHelpCount: number;
    quizzes: {
      id: string;
      code: string;
      title: string;
      subject: string;
      questionCount: number;
      attempts: number;
      avgNilai: number;
      bestNilai: number;
    }[];
    chart: { date: string; submissions: number }[];
  };
};

const rowSchema = {
  id: Number,
  header: String,
  type: String,
  status: String,
  target: String,
  limit: String,
  reviewer: String,
};

function toTableRows(quizzes: NonNullable<TeacherDashboard["stats"]>["quizzes"]) {
  return quizzes.map((q, i) => ({
    id: i + 1,
    header: q.title,
    type: q.subject || "Umum",
    status: q.attempts > 0 ? "Done" : "In Process",
    target: q.attempts > 0 ? String(q.avgNilai) : "—",
    limit: `${q.questionCount} soal`,
    reviewer: "Guru",
  }));
}

export default function TeacherPage() {
  const [data, setData] = useState<TeacherDashboard | null>(null);
  const [results, setResults] = useState<QuizResultItem[] | null>(null);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

  useEffect(() => {
    void (async () => {
      const token = await getValidToken();
      if (!token) return;
      try {
        const res = await fetch(`${apiUrl}/teacher/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const payload = await res.json();
        if (payload.success) setData(payload);
      } catch {}
      try {
        const res = await fetch(`${apiUrl}/teacher/quiz-results`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const payload = await res.json();
        if (payload.success) setResults(payload.data);
      } catch {}
    })();
  }, [apiUrl]);

  const stats = data?.stats;
  const tableRows = useMemo(() => toTableRows(stats?.quizzes ?? []), [stats?.quizzes]);

  const classMap = useMemo(() => {
    const m: Record<string, string> = {};
    for (const c of [...(data?.classesTaught ?? []), ...(data?.waliClasses ?? [])]) {
      m[c.id] = c.name;
    }
    return m;
  }, [data?.classesTaught, data?.waliClasses]);

  const tabs = useMemo<DataTableTab[]>(
    () => [
      { value: "outline", label: "Daftar Modul" },
      {
        value: "evaluasi",
        label: "Evaluasi",
        badge: results?.length ?? 0,
        content: <EvaluasiTab results={results} />,
      },
      {
        value: "profil",
        label: "Profil Siswa",
        badge: data?.students?.length ?? 0,
        content: (
          <ProfilSiswaTab
            students={data?.students}
            classMap={classMap}
            totalQuizzes={stats?.totalQuizzes ?? 0}
            results={results}
          />
        ),
      },
    ],
    [results, data?.students, classMap, stats?.totalQuizzes]
  );

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <div className="px-4 lg:px-6">
            <h1 className="text-2xl font-semibold tracking-tight">
              Selamat datang, {data?.profile?.full_name ?? "Guru BISA"}!
            </h1>
            <p className="text-sm text-muted-foreground mt-1 max-w-3xl">
              Platform LMS inklusif untuk tunanetra, tunarungu, dan tunawicara. Pantau{" "}
              <span className="font-medium text-foreground">progres belajar</span> dan{" "}
              <span className="font-medium text-foreground">hasil kuis</span>.
            </p>

            {(data?.classesTaught?.length ?? 0) > 0 || (data?.waliClasses?.length ?? 0) > 0 ? (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {(data?.classesTaught?.length ?? 0) > 0 ? (
                  <>
                    <span className="text-xs font-semibold text-muted-foreground">Kelas Binaan:</span>
                    {data?.classesTaught?.map((c) => (
                      <Badge key={c.id} variant="secondary">
                        Kelas {c.name}
                      </Badge>
                    ))}
                  </>
                ) : null}
                {(data?.waliClasses?.length ?? 0) > 0 ? (
                  <>
                    <span className="text-xs font-semibold text-muted-foreground">Wali Kelas:</span>
                    {data?.waliClasses?.map((c) => (
                      <Badge key={c.id} variant="secondary">
                        Kelas {c.name}
                      </Badge>
                    ))}
                  </>
                ) : null}
              </div>
            ) : null}
          </div>

          <SectionCards
            activeStudents={stats?.activeStudents ?? 0}
            totalQuizzes={stats?.totalQuizzes ?? 0}
            engagementPct={stats?.engagementPct ?? 0}
            needsHelpCount={stats?.needsHelpCount ?? 0}
          />
          <div className="px-4 lg:px-6">
            <ChartAreaInteractive data={stats?.chart ?? []} />
          </div>
          {stats ? (
            <DataTable key="real-data" data={tableRows} tabs={tabs} />
          ) : (
            <div className="mx-4 rounded-3xl border border-dashed border-slate-300 bg-white/60 px-6 py-12 text-center text-sm text-slate-500 lg:mx-6">
              Memuat daftar modul…
            </div>
          )}
        </div>
      </div>
    </div>
  );
}