"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowRight01Icon,
  MicroscopeIcon,
  CalculatorIcon,
  TranslateIcon,
  Copy01Icon,
  Tick02Icon,
  BookOpen02Icon,
} from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import type { Quiz, QUIZZES } from "@/types/questions";

export interface SubjectConfig {
  icon: React.ComponentProps<typeof HugeiconsIcon>["icon"];
  color: string;
}

export const SUBJECT_CONFIG: Record<string, SubjectConfig> = {
  IPA: { icon: MicroscopeIcon, color: "text-sky-600" },
  Matematika: { icon: CalculatorIcon, color: "text-violet-600" },
  "Bahasa Indonesia": { icon: TranslateIcon, color: "text-amber-600" },
};

export const FALLBACK_CONFIG: SubjectConfig = {
  icon: BookOpen02Icon,
  color: "text-slate-500",
};

export function groupBySubject(quizzes: typeof QUIZZES): [string, Quiz[]][] {
  const map = new Map<string, Quiz[]>();
  for (const q of quizzes) {
    if (!map.has(q.subject)) map.set(q.subject, []);
    map.get(q.subject)!.push(q);
  }
  return [...map.entries()];
}

const FOLD_SIZE = 36;
const FOLD_RADIUS = 6;
const BORDER_COLOR = "#cbd5e1";

export function DogEarFold({
  size = FOLD_SIZE,
  radius = FOLD_RADIUS,
}: {
  id?: string;
  size?: number;
  radius?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="pointer-events-none absolute right-0 top-0 z-20"
      aria-hidden="true"
    >
      <polygon points={`0,0 ${size},0 ${size},${size}`} fill="#f8fafc" />
      <path
        d={`M 0 0 L 0 ${size - radius} Q 0 ${size} ${radius} ${size} L ${size} ${size} Z`}
        fill="#ffffff"
        stroke={BORDER_COLOR}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <line
        x1="0"
        y1="0"
        x2={size}
        y2={size}
        stroke={BORDER_COLOR}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function PaperQuizCard({
  subject,
  quizzes,
  copied,
  onCopy,
  onPlay,
  isFirst,
  isLast,
  index,
  isSelected,
  onSelect,
  results,
}: {
  subject: string;
  quizzes: Quiz[];
  copied: string | null;
  onCopy: (code: string) => void;
  onPlay: (code: string) => void;
  isFirst?: boolean;
  isLast?: boolean;
  index?: number;
  isSelected?: boolean;
  onSelect: () => void;
  results?: Record<string, { nilai: number } | null | undefined>;
}) {
  const cfg = SUBJECT_CONFIG[subject] ?? FALLBACK_CONFIG;
  const shown = quizzes.slice(0, 3);
  const extra = quizzes.length - 3;

  const roundClasses = isFirst
    ? isSelected
      ? "rounded-tl-2xl rounded-tr-none rounded-b-none"
      : "rounded-t-2xl rounded-b-none"
    : isLast
    ? isSelected
      ? "rounded-t-none rounded-tr-none rounded-b-2xl"
      : "rounded-t-none rounded-b-2xl"
    : isSelected
    ? "rounded-none rounded-tr-none"
    : "rounded-none";

  return (
    <article
      onClick={onSelect}
      className={`relative cursor-pointer ${
        index && index > 0 ? "-mt-px" : ""
      } transition-all duration-200`}
      style={{ zIndex: isSelected ? 30 : 10 - (index || 0) }}
    >
      <div
        className={`relative overflow-hidden ${roundClasses} border border-slate-300 ${
          isSelected ? "bg-white" : "bg-white/95"
        }`}
        style={
          isSelected
            ? {
                clipPath: `polygon(0 0, calc(100% - ${FOLD_SIZE}px) 0, 100% ${FOLD_SIZE}px, 100% 100%, 0 100%)`,
              }
            : undefined
        }
      >
        <div className="flex flex-col sm:flex-row min-h-[120px]">
          <div className="flex w-full sm:w-52 shrink-0 flex-row sm:flex-col items-center sm:items-start justify-between sm:justify-start gap-2 border-b sm:border-b-0 sm:border-r border-slate-200 bg-slate-50/50 p-5 sm:p-6">
            <div className="flex items-center gap-3 sm:flex-col sm:items-start">
              <span
                className={`flex size-10 items-center justify-center rounded-xl bg-white shadow-xs ring-1 ring-slate-200/80 ${cfg.color}`}
              >
                <HugeiconsIcon icon={cfg.icon} size={20} strokeWidth={1.8} />
              </span>
              <div>
                <h3 className="text-base font-semibold text-slate-800 sm:mt-2">
                  {subject}
                </h3>
                <p className="text-xs font-medium text-slate-400">
                  {quizzes.length} kuis tersedia
                </p>
              </div>
            </div>
          </div>

          <div
            className={`flex min-w-0 flex-1 flex-col divide-y divide-slate-100 ${
              isSelected ? "pr-4 sm:pr-14" : "pr-4 sm:pr-6"
            }`}
          >
            {shown.map((quiz, i) => {
              const result = results?.[quiz.id];
              return (
                <div
                  key={quiz.id}
                  onClick={onSelect}
                  className="flex min-w-0 items-center gap-3 px-5 py-4 sm:px-6"
                >
                  <span className="shrink-0 rounded-md bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-500">
                    Kuis {i + 1}
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-800">
                      {quiz.title}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-slate-400">
                      {quiz.questions.length} soal · {quiz.timeLimit} dtk
                      {result?.nilai != null && (
                        <>
                          {" · "}
                          <span className="font-semibold text-emerald-600 tabular-nums">
                            Nilai {result.nilai}
                          </span>
                        </>
                      )}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-2 whitespace-nowrap">
                    <div className="hidden md:block text-right">
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                        Kode
                      </p>
                      <p
                        className="text-xs font-semibold tracking-[0.18em] text-slate-700"
                        aria-label={`Kode ${quiz.code}`}
                      >
                        {quiz.code}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onCopy(quiz.code);
                      }}
                      aria-label={
                        copied === quiz.code
                          ? "Kode tersalin"
                          : `Salin kode ${quiz.code}`
                      }
                      className="flex size-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                    >
                      <HugeiconsIcon
                        icon={copied === quiz.code ? Tick02Icon : Copy01Icon}
                        size={14}
                        strokeWidth={2}
                        className={
                          copied === quiz.code ? "text-emerald-600" : undefined
                        }
                      />
                    </button>

                    <Button
                      size="sm"
                      className="h-8 rounded-xl bg-slate-900 px-3.5 text-xs font-semibold text-white hover:bg-slate-800 active:scale-95"
                      onClick={(e) => {
                        e.stopPropagation();
                        onPlay(quiz.code);
                      }}
                    >
                      Mainkan
                      <HugeiconsIcon
                        icon={ArrowRight01Icon}
                        size={13}
                        strokeWidth={2.5}
                      />
                    </Button>
                  </div>
                </div>
              );
            })}

            {extra > 0 && (
              <div className="flex items-center px-5 sm:px-6 py-3">
                <button
                  type="button"
                  className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
                >
                  Lihat semua {extra} kuis lainnya
                  <HugeiconsIcon
                    icon={ArrowRight01Icon}
                    size={13}
                    strokeWidth={2.5}
                  />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {isSelected && <DogEarFold size={FOLD_SIZE} radius={FOLD_RADIUS} />}
    </article>
  );
}