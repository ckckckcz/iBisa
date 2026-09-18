"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  FullScreenIcon,
  MinimizeScreenIcon,
  Logout01Icon,
} from "@hugeicons/core-free-icons";
import { QUIZZES, type Quiz } from "@/types/questions";
import { fetchLobbyQuizzes } from "@/lib/quizzes";
import { getValidToken } from "@/lib/ai-helpers";
import {
  AvatarChip,
  useFullscreen,
} from "@/features/student-quiz/player-components";
import {
  PaperQuizCard,
  groupBySubject,
} from "@/features/student-quiz/paper-quiz-card";
import { useStudentIdentity } from "@/hooks/use-student-identity";
import { Skeleton } from "@/components/ui/skeleton";

type StudentQuizResult = {
  quiz_id: string;
  quiz_title: string | null;
  subject: string | null;
  score: number;
  correct_count: number;
  total_questions: number;
  nilai: number;
  created_at: string;
};

export default function StudentLobbyPage() {
  const router = useRouter();
  const { identity } = useStudentIdentity();
  const [copied, setCopied] = useState<string | null>(null);
  const { isFullscreen, toggleFullscreen } = useFullscreen();

  function handleLogout() {
    document.cookie = "token=; path=/; max-age=0; SameSite=Lax";
    document.cookie = "refresh_token=; path=/; max-age=0; SameSite=Lax";
    localStorage.removeItem("token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("expires_at");
    localStorage.removeItem("profile");
    router.push("/login");
  }

  const [quizzes, setQuizzes] = useState<Quiz[] | null>(null);
  const [results, setResults] = useState<Record<string, { nilai: number }>>(
    {}
  );
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

  useEffect(() => {
    let live = true;
    void fetchLobbyQuizzes()
      .then((list) => {
        if (live) setQuizzes(list);
      })
      .catch(() => {
        if (live) setQuizzes(QUIZZES);
      });
    return () => {
      live = false;
    };
  }, []);

  useEffect(() => {
    let live = true;
    void (async () => {
      const token = await getValidToken();
      if (!token) return;
      try {
        const res = await fetch(`${apiUrl}/student/quiz-results`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const payload = await res.json();
        if (!payload.success) return;
        const list = (payload.data ?? []) as StudentQuizResult[];
        const latestByQuiz = new Map<string, { nilai: number }>();
        for (const r of list) {
          if (!latestByQuiz.has(r.quiz_id)) {
            latestByQuiz.set(r.quiz_id, { nilai: r.nilai });
          }
        }
        if (live) setResults(Object.fromEntries(latestByQuiz));
      } catch {}
    })();
    return () => {
      live = false;
    };
  }, [apiUrl]);

  const grouped = useMemo(() => groupBySubject(quizzes ?? []), [quizzes]);
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const activeSubject = selectedSubject || (grouped[0]?.[0] ?? "");

  async function copyCode(quizCode: string) {
    try {
      await navigator.clipboard.writeText(quizCode);
      setCopied(quizCode);
      window.setTimeout(
        () => setCopied((c) => (c === quizCode ? null : c)),
        1500
      );
    } catch {}
  }

  return (
    <div className="min-h-dvh bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-5xl items-center gap-2 px-4">
          <Image
            src="/logo1.png"
            alt="BISA"
            width={32}
            height={32}
            className="size-8 object-contain"
            priority
          />
          <div className="leading-tight">
            <p className="text-sm font-semibold tracking-tight">BISA Quiz</p>
            <p className="text-[11px] text-slate-500">Belajar sambil main</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <AvatarChip name={identity.name} avatarUrl={identity.avatarUrl} />
            <button
              type="button"
              onClick={toggleFullscreen}
              aria-label={isFullscreen ? "Keluar layar penuh" : "Layar penuh"}
              className="flex size-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600 ring-1 ring-slate-200 transition-colors hover:bg-slate-200"
              title={isFullscreen ? "Keluar Layar Penuh" : "Layar Penuh"}
            >
              <HugeiconsIcon
                icon={isFullscreen ? MinimizeScreenIcon : FullScreenIcon}
                size={18}
                strokeWidth={2}
              />
            </button>
            <button
              type="button"
              onClick={handleLogout}
              aria-label="Keluar akun"
              title="Keluar"
              className="flex size-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600 ring-1 ring-slate-200 transition-colors hover:bg-rose-50 hover:text-rose-600 hover:ring-rose-200 cursor-pointer"
            >
              <HugeiconsIcon
                icon={Logout01Icon}
                size={18}
                strokeWidth={2}
              />
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex min-h-[calc(100dvh-3.5rem)] w-full max-w-5xl flex-col gap-6 px-4 py-8">
        <section className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
            Mau main kuis apa hari ini?
          </h1>
          <p className="max-w-md text-sm text-slate-500">
            Pilih kuis di bawah untuk mulai belajar sambil bermain. Semua soal
            bisa dikerjakan pakai suara maupun ketukan.
          </p>
        </section>

        <section aria-label="Daftar kuis" className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400">
              Pilih Kuis
            </h2>
            <span className="text-xs font-semibold text-slate-400">
              {quizzes === null ? <Skeleton className="inline-block h-4 w-20" /> : `${quizzes.length} kuis total`}
            </span>
          </div>

          {quizzes === null ? (
            <div className="flex flex-col gap-3">
              {Array.from({ length: 2 }).map((_, i) => (
                <div
                  key={i}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                    <Skeleton className="h-5 w-36" />
                    <Skeleton className="h-8 w-24" />
                  </div>
                  <div className="grid gap-3 p-4 sm:grid-cols-2">
                    {Array.from({ length: i === 0 ? 4 : 2 }).map((_, j) => (
                      <div
                        key={j}
                        className="flex items-center justify-between rounded-xl border border-slate-100 p-4"
                      >
                        <div className="flex flex-col gap-2">
                          <Skeleton className="h-4 w-40" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                        <Skeleton className="h-9 w-24" />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col">
              {grouped.map(([subject, quizzes], idx) => (
                <PaperQuizCard
                  key={subject}
                  subject={subject}
                  quizzes={quizzes}
                  copied={copied}
                  onCopy={copyCode}
                  onPlay={(c) => router.push("/student/" + c)}
                  isFirst={idx === 0}
                  isLast={idx === grouped.length - 1}
                  index={idx}
                  isSelected={activeSubject === subject}
                  onSelect={() => setSelectedSubject(subject)}
                  results={results}
                />
              ))}
            </div>
          )}
        </section>

        <footer className="mt-auto pt-2 text-center text-xs text-slate-400">
          Bisa dimainkan penuh pakai suara: dengarkan soal, ucapkan jawaban,
          kejar streak poin.
        </footer>
      </div>
    </div>
  );
}