"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon, Copy01Icon, Tick02Icon, Idea01Icon, Edit02Icon, CheckmarkCircle02Icon, Copy02Icon, TrashIcon } from "@hugeicons/core-free-icons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import QuizEditor from "@/features/quiz/quiz-editor";
import { ClassPickerChips } from "@/features/quiz/class-picker";
import { QuizDetailSkeleton } from "@/features/quiz/quiz-detail-skeleton";
import { fetchTeacherQuizzes, deleteQuizByCode, getQuizTheme, fetchAssignableClasses, updateQuizByCode, type AssignableClass, type DbQuiz } from "@/lib/quizzes";
import { dataGet, dataSet, dataClear } from "@/lib/data-cache";
import { useAuth } from "@/hooks/use-auth";

const LETTERS = ["A", "B", "C", "D"] as const;

export default function TeacherQuizDetailPage() {
  const params = useParams<{ code: string }>();
  const router = useRouter();
  const { profile } = useAuth();
  const rawCode = decodeURIComponent(params.code ?? "");
  const cachedQuizzes = dataGet<DbQuiz[]>("quizzes:all");
  const [quiz, setQuiz] = useState<DbQuiz | null>(() =>
    cachedQuizzes ? (cachedQuizzes.find((r) => r.code === rawCode) ?? null) : null
  );
  const [loading, setLoading] = useState(() => cachedQuizzes === null);
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(false);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [classes, setClasses] = useState<AssignableClass[]>([]);
  const [classesLoading, setClassesLoading] = useState(true);
  const [savingClasses, setSavingClasses] = useState(false);
  const [classNote, setClassNote] = useState("");
  const [classErr, setClassErr] = useState("");

  useEffect(() => {
    let live = true;
    void fetchAssignableClasses(profile?.role).then((list) => {
      if (!live) return;
      setClasses(list);
      setClassesLoading(false);
    });
    return () => {
      live = false;
    };
  }, [profile?.role]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const rows = await fetchTeacherQuizzes();
        dataSet("quizzes:all", rows);
        const found = rows.find((r) => r.code === rawCode) ?? null;
        if (cancelled) return;
        if (!found && dataGet<DbQuiz[]>("quizzes:all") === null) setError("Kode tidak ditemukan.");
        setQuiz(found);
      } catch (e) {
        if (!cancelled && dataGet<DbQuiz[]>("quizzes:all") === null) setError(e instanceof Error ? e.message : "Gagal memuat soal.");
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

  async function confirmDelete() {
    if (!quiz) return;
    setDeleteBusy(true);
    try {
      await deleteQuizByCode(quiz.code);
      dataClear("quizzes:all");
      router.push("/teacher/quizzes");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal menghapus kuis.");
      setConfirmOpen(false);
      setDeleteBusy(false);
    }
  }

  async function toggleClass(id: string) {
    if (!quiz || !isMine) return;
    if (savingClasses) return;
    const prev = quiz.class_ids ?? [];
    const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
    setClassNote("");
    setClassErr("");
    setQuiz({ ...quiz, class_ids: next });
    setSavingClasses(true);
    try {
      const updated = await updateQuizByCode(quiz.code, { class_ids: next });
      setQuiz(updated);
      dataClear("quizzes:all");
      setClassNote("Kelas diperbarui.");
    } catch (e) {
      setQuiz({ ...quiz, class_ids: prev });
      setClassErr(e instanceof Error ? e.message : "Gagal memperbarui kelas.");
    } finally {
      setSavingClasses(false);
    }
  }

  const theme = quiz ? getQuizTheme(quiz.subject) : null;
  const isMine = !!quiz?.created_by && quiz.created_by === profile?.id;
  const isCopy = !!quiz?.original_by && quiz.original_by !== quiz.created_by;

  if (editing && quiz && isMine) {
    return (
      <QuizEditor
        quiz={quiz}
        onCancel={() => setEditing(false)}
        onSaved={(updated) => {
          setQuiz(updated);
          setEditing(false);
          setNote("Perubahan tersimpan.");
        }}
      />
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 lg:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button variant="ghost" size="sm" onClick={() => router.push("/teacher/quizzes")} className="w-fit gap-1.5">
          <HugeiconsIcon icon={ArrowLeft01Icon} size={14} /> Daftar Soal
        </Button>
        {isMine && (
          <div className="flex items-center gap-2">
            <Button size="sm" variant="destructive" onClick={() => setConfirmOpen(true)} className="gap-1.5 text-red-600">
              <HugeiconsIcon icon={TrashIcon} size={12} /> Hapus
            </Button>
            <Button size="sm" variant="outline" onClick={() => setEditing(true)} className="gap-1.5">
              <HugeiconsIcon icon={Edit02Icon} size={12} /> Edit soal
            </Button>
          </div>
        )}
      </div>

      {note && (
        <div role="status" className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
          {note}
        </div>
      )}

      {loading ? (
        <QuizDetailSkeleton />
      ) : error || !quiz || !theme ? (
        <div className="rounded-lg border border-dashed border-neutral-300 bg-white px-6 py-10 text-center">
          <p className="text-sm text-muted-foreground">{error || "Kuis tidak ditemukan."}</p>
          <Link href="/teacher/quizzes" className="mt-3 inline-flex h-7 items-center justify-center rounded-lg border border-input bg-background px-2.5 text-xs font-medium hover:bg-muted">
            Kembali ke Daftar Soal
          </Link>
        </div>
      ) : (
        <>
          {!isMine && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
              Kuis ini dibuat oleh {quiz.created_by_name || "guru lain"} — kamu bisa lihat tapi tidak bisa mengedit. Salin dari{" "}
              <Link href={`/teacher/library/${encodeURIComponent(quiz.code)}`} className="font-medium underline">
                Perpustakaan Soal
              </Link>{" "}
              untuk menjadikan milikmu.
            </div>
          )}

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
              <div className="mt-3">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-xs font-medium text-muted-foreground">Kelas</span>
                  {(quiz.class_ids ?? []).length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {(quiz.class_ids ?? []).map((cid) => {
                        const name = classes.find((c) => c.id === cid)?.name;
                        return (
                          <span key={cid} className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${theme.softBg} ${theme.softText}`}>
                            {name ?? cid.slice(0, 8)}
                          </span>
                        );
                      })}
                    </div>
                  ) : (
                    <span className="text-xs text-amber-600">Belum ditugaskan — tersembunyi dari murid</span>
                  )}
                  {savingClasses && <span className="text-xs text-muted-foreground">Menyimpan…</span>}
                </div>
                {isMine && (
                  <div className="mt-2">
                    <ClassPickerChips
                      classes={classes}
                      selectedIds={quiz.class_ids ?? []}
                      loading={classesLoading}
                      solidClass={theme.solidBg}
                      onToggle={toggleClass}
                      disabled={savingClasses}
                    />
                    {classNote && <p className="mt-1 text-xs text-green-600">{classNote}</p>}
                    {classErr && <p className="mt-1 text-xs text-red-600">{classErr}</p>}
                  </div>
                )}
              </div>
              {isCopy && (
                <p className="mt-3 inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                  <HugeiconsIcon icon={Copy02Icon} size={12} /> Original by {quiz.original_by_name || "pembuat asli"}
                </p>
              )}
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
      )}

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={(open) => {
          if (!open && !deleteBusy) setConfirmOpen(false);
        }}
        title="Hapus kuis?"
        description={
          quiz ? (
            <>
              Kuis <span className="font-semibold text-neutral-800 dark:text-neutral-200">“{quiz.title}”</span> beserta nilai pengerjaan murid akan dihapus permanen. Tindakan ini tidak bisa dibatalkan.
            </>
          ) : undefined
        }
        busy={deleteBusy}
        onConfirm={confirmDelete}
      />
    </div>
  );
}