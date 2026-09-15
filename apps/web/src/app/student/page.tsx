"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  FullScreenIcon,
  MinimizeScreenIcon,
} from "@hugeicons/core-free-icons";
import { QUIZZES } from "@/types/questions";
import {
  AvatarChip,
  useFullscreen,
} from "@/features/student-quiz/player-components";
import {
  PaperQuizCard,
  groupBySubject,
} from "@/features/student-quiz/paper-quiz-card";
import { useStudentIdentity } from "@/hooks/use-student-identity";

export default function StudentLobbyPage() {
  const router = useRouter();
  const { identity } = useStudentIdentity();
  const [copied, setCopied] = useState<string | null>(null);
  const { isFullscreen, toggleFullscreen } = useFullscreen();

  const grouped = useMemo(() => groupBySubject(QUIZZES), []);
  const [selectedSubject, setSelectedSubject] = useState<string>(
    () => grouped[0]?.[0] || "IPA"
  );

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
            <p className="text-sm font-extrabold tracking-tight">BISA Quiz</p>
            <p className="text-[11px] text-slate-500">Belajar sambil main</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <AvatarChip name={identity.name} avatarUrl={identity.avatarUrl} />
            <button
              type="button"
              onClick={toggleFullscreen}
              aria-label={isFullscreen ? "Keluar layar penuh" : "Layar penuh"}
              className="flex size-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600 ring-1 ring-slate-200 transition-colors hover:bg-slate-200"
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

      <div className="mx-auto flex min-h-[calc(100dvh-3.5rem)] w-full max-w-5xl flex-col gap-6 px-4 py-8">
        <section className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">
            Mau main kuis apa hari ini?
          </h1>
          <p className="max-w-md text-sm text-slate-500">
            Pilih kuis di bawah untuk mulai belajar sambil bermain. Semua soal
            bisa dikerjakan pakai suara maupun ketukan.
          </p>
        </section>

        <section aria-label="Daftar kuis" className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400">
              Pilih Kuis
            </h2>
            <span className="text-xs font-semibold text-slate-400">
              {QUIZZES.length} kuis total
            </span>
          </div>

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
                isSelected={selectedSubject === subject}
                onSelect={() => setSelectedSubject(subject)}
              />
            ))}
          </div>
        </section>

        <footer className="mt-auto pt-2 text-center text-xs text-slate-400">
          Bisa dimainkan penuh pakai suara: dengarkan soal, ucapkan jawaban,
          kejar streak poin.
        </footer>
      </div>
    </div>
  );
}
