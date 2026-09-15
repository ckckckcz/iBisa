"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon, Copy01Icon, Tick02Icon, Idea01Icon, CheckmarkCircle02Icon } from "@hugeicons/core-free-icons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { fetchTeacherQuizzes, getQuizTheme, type DbQuiz } from "@/lib/quizzes";

const LETTERS = ["A", "B", "C", "D"] as const;

export default function TeacherQuizDetailPage() {
  const params = useParams<{ code: string }>();
  const router = useRouter();
  const rawCode = decodeURIComponent(params.code ?? "");
  const [quiz, setQuiz] = useState<DbQuiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      setError("");
      try {
        const rows = await fetchTeacherQuizzes();
        const found = rows.find((r) => r.code === rawCode) ?? null;
        if (!cancelled) {
          if (!found) setError("Kode tidak ditemukan.");
          setQuiz(found);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Gagal memuat soal.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [rawCode]);

  async function copy() {
    if (!quiz) return;
    try {
      await navigator.clipboard.writeText(quiz.code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {}
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 lg:p-6">
      <Button variant="ghost" size="sm" onClick={() => router.push("/teacher/quizzes")} className="w-fit gap-1.5">
        <HugeiconsIcon icon={ArrowLeft01Icon} size={14} /> Semua Soal
      </Button>

      {loading ? (
        <p className="py-8 text-center text-sm text-muted-foreground">Memuat...</p>
      ) : error || !quiz ? (
        <div className="rounded-lg border border-dashed border-neutral-300 bg-white px-6 py-10 text-center">
          <p className="text-sm text-muted-foreground">{error || "Kuis tidak ditemukan."}</p>
          <Link href="/teacher/quizzes" className="mt-3 inline-flex h-7 items-center justify-center rounded-lg border border-input bg-background px-2.5 text-xs font-medium hover:bg-muted">
            Kembali ke Bank Soal
          </Link>
        </div>
      ) : (
        <>
          {(() => {
            const theme = getQuizTheme(quiz.subject);
            return (
              <>
                <div className={`overflow-hidden rounded-lg border bg-white shadow-sm ring-1 ${theme.softRing}`}>
                  <div className="px-4 py-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <h1 className="text-lg font-semibold leading-tight text-neutral-900">{quiz.title}</h1>
                      <Badge variant="secondary" className={`${theme.softBg} ${theme.softText} border-0`}>
                        {quiz.subject?.trim() ? quiz.subject : "Umum"}
                      </Badge>
                    </div>
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span>{quiz.questions.length} soal</span>
                      <span className="text-neutral-300">/</span>
                      <span>{quiz.time_limit} dtk</span>
                      <span className="text-neutral-300">/</span>
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${theme.softBg} ${theme.softText}`}>{
                        quiz.subject?.trim() === "IPA" ? "IPA" : quiz.subject?.trim() === "Matematika" ? "MTK" : quiz.subject?.trim() || "Umum"
                      }</span>
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <span className={`rounded px-3 py-1.5 font-mono text-sm font-bold tracking-widest text-white ${theme.codeBg}`}>{quiz.code}</span>
                      <Button size="sm" variant="outline" onClick={copy} className="gap-1.5">
                        <HugeiconsIcon icon={copied ? Tick02Icon : Copy01Icon} size={12} />
                        {copied ? "Tersalin" : "Salin kode"}
                      </Button>
                      <Link href="/teacher/ai" className={`inline-flex h-7 items-center justify-center gap-1.5 rounded-lg px-2.5 text-xs font-medium text-white hover:opacity-90 ${theme.solidBg}`}>
                        <HugeiconsIcon icon={Idea01Icon} size={12} /> Buka Chat AI
                      </Link>
                    </div>
                  </div>
                </div>

                <ol className="space-y-3">
                  {quiz.questions.map((q, i) => (
                    <li key={i} className={`rounded-lg border bg-white px-4 py-4 shadow-sm ring-1 ${theme.softRing}`}>
                      <p className="flex gap-2 text-sm font-medium leading-snug text-neutral-900">
                        <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${theme.solidBg}`}>{i + 1}</span>
                        <span>{q.question}</span>
                      </p>
                      <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                        {q.options.map((o, oi) => (
                          <li
                            key={oi}
                            className={`rounded-md border px-3 py-2 text-sm ${oi === q.answerIndex ? `border-transparent text-white ${theme.solidBg}` : `border-neutral-200 bg-neutral-50 text-neutral-700 ${theme.softRing} ring-0 hover:bg-white`}`}
                          >
                            <span className="font-mono text-xs font-semibold">{LETTERS[oi]}.</span> {o}
                            {oi === q.answerIndex && (
                              <span className="ml-2 inline-flex items-center gap-1 text-xs font-medium text-white/90">
                                <HugeiconsIcon icon={CheckmarkCircle02Icon} size={12} /> kunci
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                      {!!q.explanation && (
                        <p className="mt-3 text-xs leading-relaxed text-neutral-600">{q.explanation}</p>
                      )}
                    </li>
                  ))}
                </ol>
              </>
            );
          })()}
        </>
      )}
    </div>
  );
}
