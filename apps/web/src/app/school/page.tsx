"use client";

import { useEffect, useMemo, useState } from "react";
import { ChartAreaInteractive } from "@/components/chart-area-interactive";
import { DataTable, type DataTableTab } from "@/components/data-table";
import { SectionCards } from "@/components/section-cards";
import { Skeleton } from "@/components/ui/skeleton";
import { ModuleTableSkeleton } from "@/components/module-table-skeleton";
import { getValidToken } from "@/lib/ai-helpers";
import { quizStatus } from "@/lib/quizzes";
import { EvaluasiTab } from "@/features/teacher/evaluasi-tab";
import { ProfilSiswaTab, type ProfilStudent } from "@/features/teacher/profil-siswa-tab";
import type { QuizResultItem } from "@/features/teacher/quiz-results-table";

type SchoolClass = { id: string; name: string };

type SchoolDashboard = {
  profile?: { id: string; full_name: string; role?: string } | null;
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
  } | null;
};

function toTableRows(quizzes: NonNullable<SchoolDashboard["stats"]>["quizzes"], totalStudents: number) {
  return quizzes.map((q, i) => ({
    id: i + 1,
    header: q.title,
    type: q.subject || "Umum",
    status: quizStatus(q.attemptedStudents, totalStudents),
    target: q.attemptedStudents > 0 ? String(q.avgNilai) : "—",
    limit: `${q.questionCount} soal`,
  }));
}

export default function SchoolPage() {
  const [data, setData] = useState<SchoolDashboard | null>(null);
  const [students, setStudents] = useState<ProfilStudent[] | null>(null);
  const [results, setResults] = useState<QuizResultItem[] | null>(null);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [failed, setFailed] = useState(false);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

  useEffect(() => {
    void (async () => {
      const token = await getValidToken();
      if (!token) {
        setFailed(true);
        return;
      }
      const headers = { Authorization: `Bearer ${token}` };
      try {
        const res = await fetch(`${apiUrl}/school/dashboard`, { headers });
        const payload = await res.json();
        if (payload.success) setData(payload.data);
        else setFailed(true);
      } catch {
        setFailed(true);
      }
      try {
        const res = await fetch(`${apiUrl}/school/quiz-results`, { headers });
        const payload = await res.json();
        if (payload.success) setResults(payload.data);
      } catch {}
      try {
        const res = await fetch(`${apiUrl}/school/students`, { headers });
        const payload = await res.json();
        if (payload.success) setStudents(payload.data);
      } catch {}
      try {
        const res = await fetch(`${apiUrl}/school/classes`, { headers });
        const payload = await res.json();
        if (payload.success) setClasses(payload.data);
      } catch {}
    })();
  }, [apiUrl]);

  const loading = data === null && !failed;
  const stats = data?.stats;
  const tableRows = useMemo(
    () => toTableRows(stats?.quizzes ?? [], stats?.activeStudents ?? 0),
    [stats?.quizzes, stats?.activeStudents]
  );

  const classMap = useMemo(() => {
    const m: Record<string, string> = {};
    for (const c of classes) m[c.id] = c.name;
    return m;
  }, [classes]);

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
        badge: students?.length ?? 0,
        content: (
          <ProfilSiswaTab
            students={students ?? undefined}
            classMap={classMap}
            totalQuizzes={stats?.totalQuizzes ?? 0}
            results={results}
            emptyHeading="Belum ada siswa terdaftar"
            emptyHint="Tambahkan murid di menu Manajemen Akun (> Murid) agar siswa muncul di sini."
          />
        ),
      },
    ],
    [results, students, classMap, stats?.totalQuizzes]
  );

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <div className="px-4 lg:px-6">
            <h1 className="text-2xl font-semibold tracking-tight">
              Selamat datang,{" "}
              {loading ? (
                <Skeleton className="inline-block h-[1.3em] w-44 align-baseline" />
              ) : (
                <>{data?.profile?.full_name ?? "Sekolah BISA"}!</>
              )}
            </h1>
            <p className="text-sm text-muted-foreground mt-1 max-w-3xl">
              Kelola <span className="font-medium text-foreground">siswa ABK</span>, pantau{" "}
              <span className="font-medium text-foreground">kelas inklusi</span> dan{" "}
              <span className="font-medium text-foreground">guru pendamping</span> — data terpusat untuk pendampingan adaptif.
            </p>
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
          {loading ? <ModuleTableSkeleton /> : <DataTable data={tableRows} tabs={tabs} />}
        </div>
      </div>
    </div>
  );
}