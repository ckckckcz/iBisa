"use client";

import { useEffect, useMemo, useState } from "react";
import { ChartAreaInteractive } from "@/components/chart-area-interactive";
import { DataTable } from "@/components/data-table";
import { SectionCards } from "@/components/section-cards";
import { getValidToken } from "@/lib/ai-helpers";
import { QuizResultsTable, type QuizResultItem } from "@/features/teacher/quiz-results-table";
import { Badge } from "@/components/ui/badge";

type TeacherDashboard = {
  profile?: { id: string; full_name: string; subject?: string };
  assignedClasses?: { id: string; name: string; tingkat: string }[];
  students?: { id: string; full_name: string; grade?: string; status?: string }[];
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

            {data?.assignedClasses && data.assignedClasses.length > 0 && (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-muted-foreground">Kelas Binaan:</span>
                {data.assignedClasses.map((c) => (
                  <Badge key={c.id} variant="secondary">
                    Kelas {c.name} (Tingkat {c.tingkat})
                  </Badge>
                ))}
              </div>
            )}
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
          <div className="px-4 lg:px-6">
            <h2 className="text-sm font-semibold">Daftar Modul / Soal</h2>
            <p className="text-xs text-muted-foreground">
              Kuis dari sekolah — nilai rata-rata tiap modul diambil dari hasil pengerjaan siswa.
            </p>
          </div>
          {stats ? (
            <DataTable key="real-data" data={tableRows} />
          ) : (
            <div className="mx-4 rounded-3xl border border-dashed border-slate-300 bg-white/60 px-6 py-12 text-center text-sm text-slate-500 lg:mx-6">
              Memuat daftar modul…
            </div>
          )}
          <div className="px-4 lg:px-6">
            <h2 className="text-sm font-semibold">Hasil Kuis Siswa</h2>
            <p className="mb-3 text-xs text-muted-foreground">
              Nilai dari persentase jawaban benar, poin dari total skor kuis.
            </p>
            {results === null ? (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-white/60 px-6 py-12 text-center text-sm text-slate-500">
                Memuat hasil kuis…
              </div>
            ) : (
              <QuizResultsTable results={results} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}