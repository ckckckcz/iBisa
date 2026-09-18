"use client";

import { useEffect, useMemo, useState } from "react";
import { ChartAreaInteractive } from "@/components/chart-area-interactive";
import { DataTable, type DataTableTab } from "@/components/data-table";
import { SectionCards } from "@/components/section-cards";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { getValidToken } from "@/lib/ai-helpers";
import { dataGet, dataSet } from "@/lib/data-cache";
import { quizStatus } from "@/lib/quizzes";
import { ModuleTableSkeleton } from "@/components/module-table-skeleton";
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
      attemptedStudents: number;
      avgNilai: number;
      bestNilai: number;
    }[];
    chart: { date: string; submissions: number }[];
  };
};

function toTableRows(quizzes: NonNullable<TeacherDashboard["stats"]>["quizzes"], totalStudents: number) {
  return quizzes.map((q, i) => ({
    id: i + 1,
    header: q.title,
    type: q.subject || "Umum",
    status: quizStatus(q.attemptedStudents, totalStudents),
    target: q.attemptedStudents > 0 ? String(q.avgNilai) : "—",
    limit: `${q.questionCount} soal`,
  }));
}

export default function TeacherPage() {
  const [data, setData] = useState<TeacherDashboard | null>(() => dataGet<TeacherDashboard>("teacher:dash"));
  const [results, setResults] = useState<QuizResultItem[] | null>(() => dataGet<QuizResultItem[]>("teacher:results"));
  const [failed, setFailed] = useState(false);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const token = await getValidToken();
      if (!token) {
        if (!cancelled) setFailed(true);
        return;
      }
      const headers = { Authorization: `Bearer ${token}` };
      const [me, quiz] = await Promise.allSettled([
        fetch(`${apiUrl}/teacher/me`, { headers }).then((r) => r.json()),
        fetch(`${apiUrl}/teacher/quiz-results`, { headers }).then((r) => r.json()),
      ]);
      if (cancelled) return;
      if (me.status === "fulfilled" && me.value.success) {
        setData(me.value);
        dataSet("teacher:dash", me.value);
      } else if (!dataGet<TeacherDashboard>("teacher:dash")) {
        setFailed(true);
      }
      if (quiz.status === "fulfilled" && quiz.value.success) {
        setResults(quiz.value.data);
        dataSet("teacher:results", quiz.value.data);
      }
    })();
    return () => { cancelled = true; };
  }, [apiUrl]);

  const loading = data === null && !failed;
  const stats = data?.stats;
  const tableRows = useMemo(
    () => toTableRows(stats?.quizzes ?? [], data?.students?.length ?? 0),
    [stats?.quizzes, data?.students?.length]
  );

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
            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-8 w-72 max-w-full" />
                <Skeleton className="h-4 w-full max-w-3xl" />
                <div className="flex flex-wrap gap-2">
                  <Skeleton className="h-6 w-24 rounded-full" />
                  <Skeleton className="h-6 w-28 rounded-full" />
                </div>
              </div>
            ) : (
              <>
                <h1 className="text-2xl font-semibold tracking-tight">
                  Selamat datang,{" "}
                  {data?.profile?.full_name ?? "Guru BISA"}!
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
              </>
            )}
          </div>

          <SectionCards
            activeStudents={stats?.activeStudents ?? 0}
            totalQuizzes={stats?.totalQuizzes ?? 0}
            engagementPct={stats?.engagementPct ?? 0}
            needsHelpCount={stats?.needsHelpCount ?? 0}
            loading={loading}
          />
          <div className="px-4 lg:px-6">
            <ChartAreaInteractive data={stats?.chart ?? []} loading={loading} />
          </div>
          {failed ? (
            <div className="px-4 lg:px-6">
              <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                Gagal memuat data. Silakan muat ulang halaman.
              </div>
            </div>
          ) : stats ? (
            <DataTable key="real-data" data={tableRows} tabs={tabs} />
          ) : (
            <ModuleTableSkeleton />
          )}
        </div>
      </div>
    </div>
  );
}