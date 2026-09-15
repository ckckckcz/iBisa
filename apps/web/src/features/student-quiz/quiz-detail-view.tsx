"use client";

import { useState } from "react";
import Image from "next/image";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  Tick02Icon,
  Idea01Icon,
  FullScreenIcon,
  MinimizeScreenIcon,
  BookOpen02Icon,
  Copy01Icon,
  Mic01Icon,
  Timer01Icon,
  TrophyIcon,
  KeyboardIcon,
} from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import type { Quiz } from "@/types/questions";
import {
  OPTION_LETTERS,
  AvatarChip,
} from "./player-components";
import { SUBJECT_CONFIG, FALLBACK_CONFIG } from "./paper-quiz-card";

interface QuizDetailViewProps {
  quiz: Quiz;
  identity: { name: string; avatarUrl: string | null };
  isFullscreen: boolean;
  toggleFullscreen: () => void;
  onStartQuiz: () => void;
  onBack: () => void;
}

export function QuizDetailView({
  quiz,
  identity,
  isFullscreen,
  toggleFullscreen,
  onStartQuiz,
  onBack,
}: QuizDetailViewProps) {
  const [showAnswers, setShowAnswers] = useState(false);
  const [copied, setCopied] = useState(false);

  const subjectConfig = SUBJECT_CONFIG[quiz.subject] ?? FALLBACK_CONFIG;
  const SubIcon = subjectConfig.icon ?? BookOpen02Icon;

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(quiz.code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {}
  }

  async function shareQuiz() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: quiz.title,
          text: `Ayo kerjakan kuis ${quiz.title} di BISA Quiz! Kode: ${quiz.code}`,
          url: window.location.href,
        });
      } catch {
        copyCode();
      }
    } else {
      copyCode();
    }
  }

  return (
    <div className="min-h-dvh bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-3 px-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900"
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} size={16} strokeWidth={2.5} />
            Kembali
          </Button>
          <div className="h-4 w-px bg-slate-200" />
          <div className="flex items-center gap-2">
            <Image
              src="/logo1.png"
              alt="BISA"
              width={28}
              height={28}
              className="size-7 object-contain"
              priority
            />
            <span className="text-sm font-extrabold tracking-tight">BISA Quiz</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <AvatarChip name={identity.name} avatarUrl={identity.avatarUrl} />
            <button
              type="button"
              onClick={toggleFullscreen}
              aria-label={isFullscreen ? "Keluar layar penuh" : "Layar penuh"}
              className="flex size-9 items-center justify-center rounded-xl bg-white text-slate-600 ring-1 ring-slate-200 transition-colors hover:bg-slate-100"
            >
              <HugeiconsIcon
                icon={isFullscreen ? MinimizeScreenIcon : FullScreenIcon}
                size={18}
                strokeWidth={2}
              />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8">
        <div className="rounded-2xl border border-slate-300 bg-white p-6 shadow-xs">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 ring-1 ring-blue-200">
              <HugeiconsIcon icon={SubIcon} size={32} strokeWidth={1.8} />
            </div>

            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-black tracking-tight text-slate-900 md:text-3xl">
                {quiz.title}
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-medium text-slate-500">
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 font-bold text-blue-700 ring-1 ring-blue-200">
                  <HugeiconsIcon icon={Tick02Icon} size={12} strokeWidth={3} />
                  Assessment
                </span>
                <span>•</span>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 font-bold text-slate-700">
                  {quiz.subject}
                </span>
                <span>•</span>
                <span>Kelas 4 – 6 SD</span>
                <span>•</span>
                <span>{quiz.questions.length * 150}x Dimainkan</span>
                <span>•</span>
                <span className="font-bold text-blue-700">Tingkat Menengah</span>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-5">
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={copyCode}
                className="rounded-xl border-slate-300 font-bold text-slate-700 hover:bg-slate-50"
              >
                <HugeiconsIcon
                  icon={copied ? Tick02Icon : Copy01Icon}
                  size={15}
                  strokeWidth={2}
                  className={copied ? "text-blue-700" : undefined}
                />
                {copied ? "Kode Tersalin!" : `Kode: ${quiz.code}`}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={shareQuiz}
                className="rounded-xl border-slate-300 font-bold text-slate-700 hover:bg-slate-50"
              >
                Bagikan
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="lg"
                onClick={onStartQuiz}
                className="h-11 rounded-xl bg-blue-700 px-6 font-black tracking-wide text-white shadow-xs hover:bg-blue-800 active:scale-95"
              >
                <HugeiconsIcon
                  icon={ArrowRight01Icon}
                  size={18}
                  strokeWidth={2.8}
                  className="mr-1"
                />
                Mulai Kuis Sekarang
              </Button>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6 lg:flex-row">
          <aside className="flex w-full shrink-0 flex-col gap-4 lg:w-72">
            <div className="rounded-2xl border border-slate-300 bg-white p-5 shadow-xs">
              <h3 className="text-sm font-extrabold text-slate-800">
                Fitur Aksesibilitas
              </h3>
              <ul className="mt-3 flex flex-col gap-3 text-xs text-slate-600">
                <li className="flex items-start gap-2">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700" aria-hidden="true">
                    <HugeiconsIcon icon={Mic01Icon} size={16} strokeWidth={2} />
                  </span>
                  <div>
                    <strong className="block font-bold text-slate-800">
                      Perintah Suara Penuh
                    </strong>
                    Ucapkan huruf atau jawaban secara langsung tanpa perlu menyentuh layar.
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700" aria-hidden="true">
                    <HugeiconsIcon icon={Timer01Icon} size={16} strokeWidth={2} />
                  </span>
                  <div>
                    <strong className="block font-bold text-slate-800">
                      {quiz.timeLimit} Detik / Soal
                    </strong>
                    Waktu cukup untuk berpikir santai tanpa terburu-buru.
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700" aria-hidden="true">
                    <HugeiconsIcon icon={TrophyIcon} size={16} strokeWidth={2} />
                  </span>
                  <div>
                    <strong className="block font-bold text-slate-800">
                      Streak & Poin Bonus
                    </strong>
                    Kumpulkan skor berturut-turut untuk meraih podium tertinggi.
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700" aria-hidden="true">
                    <HugeiconsIcon icon={KeyboardIcon} size={16} strokeWidth={2} />
                  </span>
                  <div>
                    <strong className="block font-bold text-slate-800">
                      Tombol Spasi
                    </strong>
                    Tekan tombol spasi untuk mulai berbicara seketika.
                  </div>
                </li>
              </ul>
            </div>

            <div className="rounded-2xl border border-slate-300 bg-white p-5 shadow-xs">
              <h3 className="text-sm font-extrabold text-slate-800">
                Panduan Belajar
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-500">
                Kamu bisa meninjau seluruh pertanyaan dan kunci jawaban di panel samping sebelum memulai kuis.
                Nyalakan toggle <strong>Tampilkan Jawaban</strong> untuk melihat pembahasan!
              </p>
            </div>
          </aside>

          <div className="flex-1 rounded-2xl border border-slate-300 bg-white shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/60 px-6 py-4">
              <span className="text-sm font-extrabold text-slate-800">
                {quiz.questions.length} Soal • {quiz.questions.length * 10} Poin
              </span>

              <div className="flex items-center gap-2.5">
                <span className="text-xs font-bold text-slate-600">
                  Tampilkan Jawaban
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={showAnswers}
                  onClick={() => setShowAnswers(!showAnswers)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    showAnswers ? "bg-blue-700" : "bg-slate-300"
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`pointer-events-none inline-block size-5 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                      showAnswers ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </div>

            <div className="divide-y divide-slate-200">
              {quiz.questions.map((q, idx) => (
                <div key={q.id} className="flex flex-col gap-4 p-6">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    {idx + 1}. PILIHAN GANDA • {quiz.timeLimit} DTK • 10 PT
                  </div>

                  <h4 className="text-base font-bold text-slate-900 leading-snug">
                    {q.question}
                  </h4>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {q.options.map((opt, optIdx) => {
                      const isCorrect = optIdx === q.answerIndex;
                      return (
                        <div
                          key={optIdx}
                          className={`flex items-center gap-3 rounded-xl border p-3.5 transition-colors ${
                            showAnswers && isCorrect
                              ? "border-blue-300 bg-blue-50/70 text-blue-950 font-semibold"
                              : "border-slate-200 bg-white text-slate-700"
                          }`}
                        >
                          <span
                            className={`flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                              showAnswers && isCorrect
                                ? "bg-blue-700 text-white"
                                : "border border-slate-300 text-slate-400"
                            }`}
                          >
                            {showAnswers && isCorrect ? (
                              <HugeiconsIcon icon={Tick02Icon} size={14} strokeWidth={3} />
                            ) : (
                              OPTION_LETTERS[optIdx] ?? String.fromCharCode(65 + optIdx)
                            )}
                          </span>
                          <span className="text-sm">{opt}</span>
                        </div>
                      );
                    })}
                  </div>

                  {showAnswers && q.explanation && (
                    <div className="flex items-start gap-2 rounded-xl border border-blue-200/80 bg-blue-50/60 p-3 text-xs text-blue-900">
                      <HugeiconsIcon
                        icon={Idea01Icon}
                        size={16}
                        strokeWidth={2}
                        className="mt-0.5 shrink-0 text-blue-700"
                      />
                      <div>
                        <span className="font-bold">Penjelasan:</span> {q.explanation}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
