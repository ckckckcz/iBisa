"use client";

import { useMemo, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon, CheckmarkCircle01Icon, CheckmarkCircle02Icon } from "@hugeicons/core-free-icons";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { updateQuizByCode, getQuizTheme, type DbQuiz } from "@/lib/quizzes";
import { dataClear } from "@/lib/data-cache";

const LETTERS = ["A", "B", "C", "D"] as const;
const SUBJECTS = ["Umum", "IPA", "Matematika", "Bahasa Indonesia"];

type DraftQuestion = { question: string; options: [string, string, string, string]; answerIndex: number; explanation: string };

export default function QuizEditor({
  quiz,
  onSaved,
  onCancel,
}: {
  quiz: DbQuiz;
  onSaved?: (updated: DbQuiz) => void;
  onCancel?: () => void;
}) {
  const [title, setTitle] = useState(quiz.title);
  const [subject, setSubject] = useState(quiz.subject?.trim() ? quiz.subject : "Umum");
  const [timeLimit, setTimeLimit] = useState(String(quiz.time_limit || 60));
  const [questions, setQuestions] = useState<DraftQuestion[]>(() =>
    quiz.questions.map((q) => ({ question: q.question, options: q.options, answerIndex: q.answerIndex, explanation: q.explanation ?? "" }))
  );
  const [savedFlash, setSavedFlash] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const theme = getQuizTheme(subject);

  const dirty = useMemo(() => {
    return !(
      title.trim() === quiz.title.trim() &&
      (subject === "Umum" ? !quiz.subject?.trim() : subject === (quiz.subject ?? "")) &&
      Number(timeLimit) === Number(quiz.time_limit) &&
      JSON.stringify(questions) === JSON.stringify(quiz.questions)
    );
  }, [title, subject, timeLimit, questions, quiz]);

  function setQ(idx: number, patch: Partial<DraftQuestion>) {
    setQuestions((cur) => cur.map((qq, i) => (i === idx ? { ...qq, ...patch } : qq)));
  }

  function setOption(idx: number, oi: number, value: string) {
    setQuestions((cur) =>
      cur.map((qq, i) => (i === idx ? { ...qq, options: qq.options.map((o, oo) => (oo === oi ? value : o)) as DraftQuestion["options"] } : qq))
    );
  }

  async function save() {
    setBusy(true);
    setError("");
    try {
      const timeVal = Math.max(30, Number(timeLimit) || quiz.time_limit || 60);
      const cleaned = questions.map((q) => ({
        question: q.question.trim(),
        options: q.options.map((o) => o.trim()) as [string, string, string, string],
        answerIndex: q.answerIndex,
        explanation: q.explanation.trim(),
      }));
      if (cleaned.some((q) => !q.question || q.options.some((o) => !o))) {
        throw new Error("Soal dan opsi tidak boleh kosong.");
      }
      const updated = await updateQuizByCode(quiz.code, {
        title: title.trim(),
        subject: subject === "Umum" ? "" : subject,
        time_limit: timeVal,
        base_points: quiz.base_points,
        questions: cleaned,
      });
      setSavedFlash(true);
      window.setTimeout(() => setSavedFlash(false), 2000);
      dataClear("quizzes:all");
      onSaved?.(updated);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal menyimpan perubahan.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onCancel} className="w-fit gap-1.5" title="Kembali ke tampilan soal">
            <HugeiconsIcon icon={ArrowLeft01Icon} size={14} /> <span className="hidden sm:inline">Soal</span>
          </Button>
          <h1 className="text-xl font-semibold tracking-tight">Edit Soal</h1>
        </div>
        <div className="flex items-center gap-2">
          {savedFlash && (
            <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700">
              <HugeiconsIcon icon={CheckmarkCircle01Icon} size={12} /> Tersimpan
            </span>
          )}
          <Button size="sm" onClick={save} disabled={busy || !dirty} className="gap-1.5">
            <HugeiconsIcon icon={CheckmarkCircle01Icon} size={12} />
            {busy ? "Menyimpan..." : "Simpan"}
          </Button>
        </div>
      </div>

      {error && (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-[1fr_auto]">
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Judul</label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Waktu / soal (dtk)</label>
          <Input value={timeLimit} onChange={(e) => setTimeLimit(e.target.value)} inputMode="numeric" className="w-32" />
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {SUBJECTS.map((s) => {
          const active = subject === s;
          return (
            <button
              key={s}
              type="button"
              onClick={() => setSubject(s)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${active ? `${theme.solidBg} text-white` : "border border-input bg-background text-muted-foreground hover:bg-muted"}`}
            >
              {s}
            </button>
          );
        })}
      </div>

      <ol className="space-y-3">
        {questions.map((q, i) => (
          <li key={i} className={`rounded-lg border bg-white px-4 py-4 shadow-sm ring-1 ${theme.softRing}`}>
            <div className="flex items-start gap-2">
              <span className={`mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${theme.solidBg}`}>{i + 1}</span>
              <textarea
                value={q.question}
                onChange={(e) => setQ(i, { question: e.target.value })}
                rows={2}
                className="min-h-10 flex-1 resize-y rounded-md border border-input bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {q.options.map((o, oi) => (
                <li key={oi}>
                  <button
                    type="button"
                    onClick={() => setQ(i, { answerIndex: oi })}
                    className={`flex w-full items-center gap-2 rounded-md border px-3 py-2 text-left text-sm transition-colors ${oi === q.answerIndex ? `border-transparent text-white ${theme.solidBg}` : "border-neutral-200 bg-neutral-50 text-neutral-700 hover:bg-white"}`}
                    title="Klik untuk jadikan kunci jawaban"
                  >
                    <span className="shrink-0 font-mono text-xs font-semibold">{LETTERS[oi]}.</span>
                    <input
                      value={o}
                      onChange={(e) => setOption(i, oi, e.target.value)}
                      className={`min-w-0 flex-1 bg-transparent text-sm outline-none ${oi === q.answerIndex ? "text-white placeholder:text-white/60" : "text-neutral-800"}`}
                    />
                    {oi === q.answerIndex && (
                      <span className="ml-auto inline-flex shrink-0 items-center gap-1 text-xs font-medium text-white/90">
                        <HugeiconsIcon icon={CheckmarkCircle02Icon} size={12} /> kunci
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
            <textarea
              value={q.explanation}
              onChange={(e) => setQ(i, { explanation: e.target.value })}
              rows={1}
              placeholder="Pembahasan (opsional)"
              className="mt-3 w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-xs outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
            />
          </li>
        ))}
      </ol>
    </div>
  );
}