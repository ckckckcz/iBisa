"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft01Icon,
  Copy01Icon,
  Copy02Icon,
  Tick02Icon,
  Idea01Icon,
  Edit02Icon,
  CheckmarkCircle02Icon,
} from "@hugeicons/core-free-icons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { fetchTeacherQuizzes, copyQuizByCode, getQuizTheme, type DbQuiz } from "@/lib/quizzes";
import { useAuth } from "@/hooks/use-auth";

const LETTERS = ["A", "B", "C", "D"] as const;

export default function TeacherLibraryDetailPage() {
  const params = useParams<{ code: string }>();
  const router = useRouter();
  const { profile } = useAuth();
  const rawCode = decodeURIComponent(params.code ?? "");
  const [quiz, setQuiz] = useState<DbQuiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [copying, setCopying] = useState(false);
  const [copiedOk, setCopiedOk] = useState(false);
  const [error, setError] = useState("");
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      setError("");
      try {
        const rows = await fetchTeacherQuizzes();
        const found = rows.find((r) => r.code === rawCode) ?? null;
        if (cancelled) return;
        if (!found) setError("Kode tidak ditemukan.");
        setQuiz(found);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Gagal memuat soal.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [rawCode, tick]);

  async function copy() {
    if (!quiz) return;
    try {
      await navigator.clipboard.writeText(quiz.code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {}
  }

  async function handleCopyQuiz() {
    if (!quiz || copying) return;
    setCopying(true);
    setError("");
    try {
      await copyQuizByCode(quiz.code);
      setCopiedOk(true);
      window.setTimeout(() => setCopiedOk(false), 2500);
      setTick((t) => t + 1);
      router.push("/teacher/quizzes");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal menyalin kuis.");
    } finally {
      setCopying(false);
    }
  }

  const theme = quiz ? getQuizTheme(quiz.subject) : null;
  const isMine = !!quiz && quiz.created_by === profile?.id;
  const isCopy = !!quiz?.original_by && quiz?.original_by !== quiz.created_by;

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 lg:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button variant="ghost" size="sm" onClick={() => router.push("/teacher/library")} className="w-fit gap-1.5">
          <HugeiconsIcon icon={ArrowLeft01Icon} size={14} /> Perpustakaan Soal
        </Button>
        {!!quiz && !isMine && (
          <Button size="sm" variant="outline" onClick={handleCopyQuiz} disabled={copying} className="gap-1.5">
            <HugeiconsIcon icon={Copy02Icon} size={12} />
            {copying ? "Menyalin..." : copiedOk ? "Tersalin!" : "Salin ke Soal Saya"}
          </Button>
        )}
        {!!quiz && isMine && (
          <Link href={`/teacher/quizzes/${encodeURIComponent(quiz.code)}`} className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md border border-input bg-background px-3 text-sm font-medium hover:bg-muted">
            <HugeiconsIcon icon={Edit02Icon} size={14} /> Edit
          </Link>
        )}
      </div>

      {copiedOk && (
        <div role="status" className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
          Kuis tersalin ke Daftar Soal kamu — original mengacu ke pembuat asli.
        </div>
      )}
      {error && (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <p className="py-8 text-center text-sm text-muted-foreground">Memuat...</p>
      ) : error || !quiz || !theme ? (
        <div className="rounded-lg border border-dashed border-neutral-300 bg-white px-6 py-10 text-center">
          <p className="text-sm text-muted-foreground">{error || "Kuis tidak ditemukan."}</p>
          <Link href="/teacher/library" className="mt-3 inline-flex h-7 items-center justify-center rounded-lg border border-input bg-background px-2.5 text-xs font-medium hover:bg-muted">
            Kembali ke Perpustakaan Soal
          </Link>
        </div>
      ) : (
        <>
          <div className={`overflow-hidden rounded-lg border bg-white shadow-sm ring-1 ${theme.softRing}`}>
            <div className="px-4 py-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <h1 className="text-lg font-semibold leading-tight text-neutral-900">{quiz.title}</h1>
                <Badge variant="secondary" className={`${theme.softBg} ${theme.softText} border-0`}>
                  {quiz.subject?.trim() ? quiz.subject : "Umum"}
                </Badge>
              </div>
              <p className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-muted-foreground">
                <span>{quiz.questions.length} soal</span>
                <span className="text-neutral-300">/</span>
                <span>{quiz.time_limit} dtk</span>
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
              <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-neutral-100 pt-3 text-xs">
                <span className="rounded-full bg-neutral-100 px-2 py-0.5 font-medium text-neutral-600">
                  {isMine ? "Dibuat oleh kamu" : `oleh ${quiz.created_by_name || "guru lain"}`}
                </span>
                {isCopy && quiz.original_by_name && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 font-medium text-amber-700">
                    <HugeiconsIcon icon={Copy02Icon} size={12} /> Original by {quiz.original_by_name}
                  </span>
                )}
              </div>
            </div>
          </div>

          <ol className="space-y-3">
            {quiz.questions.map((qq, i) => (
              <li key={i} className={`rounded-lg border bg-white px-4 py-4 shadow-sm ring-1 ${theme.softRing}`}>
                <p className="flex gap-2 text-sm font-medium leading-snug text-neutral-900">
                  <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${theme.solidBg}`}>{i + 1}</span>
                  <span>{qq.question}</span>
                </p>
                <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                  {qq.options.map((o, oi) => (
                    <li
                      key={oi}
                      className={`rounded-md border px-3 py-2 text-sm ${oi === qq.answerIndex ? `border-transparent text-white ${theme.solidBg}` : `border-neutral-200 bg-neutral-50 text-neutral-700 ${theme.softRing} ring-0 hover:bg-white`}`}
                    >
                      <span className="font-mono text-xs font-semibold">{LETTERS[oi]}.</span> {o}
                      {oi === qq.answerIndex && (
                        <span className="ml-2 inline-flex items-center gap-1 text-xs font-medium text-white/90">
                          <HugeiconsIcon icon={CheckmarkCircle02Icon} size={12} /> kunci
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
                {!!qq.explanation && (
                  <p className="mt-3 text-xs leading-relaxed text-neutral-600">{qq.explanation}</p>
                )}
              </li>
            ))}
          </ol>
        </>
      )}
    </div>
  );
}