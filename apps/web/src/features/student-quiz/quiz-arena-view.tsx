"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft01Icon,
  Tick02Icon,
  Idea01Icon,
  Alert01Icon,
  FireIcon,
  TrophyIcon,
  VolumeHighIcon,
  VolumeMute01Icon,
  FullScreenIcon,
  MinimizeScreenIcon,
} from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Quiz } from "@/types/questions";
import type { useVoiceQuiz } from "@/hooks/use-voice-quiz";
import {
  OPTION_LETTERS,
  CountdownOverlay,
  TimerBar,
  AnswerReveal,
  Scoreboard,
  Podium,
  ResultStats,
  ReviewList,
  VoiceDock,
  VoiceMenu,
  OptionGrid,
  AvatarChip,
} from "./player-components";

const SUBJECT_CARD: Record<string, string> = {
  IPA: "bg-sky-500",
  Matematika: "bg-violet-600",
  "Bahasa Indonesia": "bg-amber-500",
};

const FALLBACK_CARD = "bg-slate-500";

interface QuizArenaViewProps {
  quiz: Quiz;
  vq: ReturnType<typeof useVoiceQuiz>;
  identity: { name: string; avatarUrl: string | null };
  isFullscreen: boolean;
  toggleFullscreen: () => void;
  onExit: () => void;
}

export function QuizArenaView({
  quiz,
  vq,
  identity,
  isFullscreen,
  toggleFullscreen,
  onExit,
}: QuizArenaViewProps) {
  const qHeadingRef = useRef<HTMLHeadingElement>(null);
  const listenOnce = vq.listenOnce;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT")) return;
      if (e.code === "Space" && !e.repeat) {
        e.preventDefault();
        listenOnce();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [listenOnce]);

  useEffect(() => {
    qHeadingRef.current?.focus();
  }, [vq.qIndex, vq.phase]);

  const subjectBg = SUBJECT_CARD[quiz.subject] ?? FALLBACK_CARD;
  const total = quiz.questions.length;
  const progress =
    vq.phase === "result"
      ? total
      : vq.phase === "idle" || vq.phase === "countdown"
      ? 0
      : vq.qIndex + (vq.phase === "question" ? 0 : 1);

  return (
    <div className="min-h-dvh bg-slate-100 text-slate-900">
      {vq.phase === "countdown" && (
        <CountdownOverlay value={vq.countdown} onSkip={vq.skipCountdown} />
      )}

      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-2 px-4">
          <button
            type="button"
            onClick={onExit}
            aria-label="Kembali ke detail kuis"
            className="flex items-center gap-2"
          >
            <Image
              src="/logo1.png"
              alt="BISA"
              width={32}
              height={32}
              className="size-8 object-contain"
              priority
            />
          </button>
          <Badge className="hidden items-center gap-1 border-0 bg-amber-100 font-extrabold text-amber-800 hover:bg-amber-100 sm:inline-flex">
            <HugeiconsIcon icon={TrophyIcon} size={13} strokeWidth={2} />
            1st
          </Badge>
          {vq.streak >= 2 && (
            <Badge className="inline-flex items-center gap-1 border-0 bg-orange-100 font-extrabold text-orange-700 hover:bg-orange-100 tabular-nums">
              <HugeiconsIcon icon={FireIcon} size={13} strokeWidth={2} />
              {vq.streak}
            </Badge>
          )}
          <div className="ml-auto flex items-center gap-2">
            <Badge className="border border-slate-200 bg-slate-50 font-extrabold tracking-widest text-slate-600 tabular-nums hover:bg-slate-50">
              {quiz.code}
            </Badge>
            <button
              type="button"
              onClick={() => vq.setTtsEnabled(!vq.ttsEnabled)}
              aria-label={vq.ttsEnabled ? "Matikan suara" : "Nyalakan suara"}
              className="flex size-9 items-center justify-center rounded-xl bg-white text-slate-600 ring-1 ring-slate-200 transition-colors hover:bg-slate-100"
            >
              <HugeiconsIcon
                icon={vq.ttsEnabled ? VolumeHighIcon : VolumeMute01Icon}
                size={18}
                strokeWidth={2}
              />
            </button>
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
            <VoiceMenu vq={vq} onExit={onExit} />
          </div>
        </div>
        <div
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={total}
          aria-label={`Progres ${progress} dari ${total} soal`}
          className="h-1 bg-slate-100"
        >
          <div
            className="h-full bg-blue-700 transition-all duration-500"
            style={{ width: `${Math.max((progress / total) * 100, 2)}%` }}
          />
        </div>
      </header>

      <div className="mx-auto flex min-h-[calc(100dvh-3.5rem)] w-full max-w-6xl flex-col gap-4 px-4 py-6">
        {!vq.support.stt && (
          <div
            className="flex items-start gap-3 rounded-2xl bg-amber-50 p-4 text-sm text-amber-800 ring-1 ring-amber-200"
            role="alert"
          >
            <HugeiconsIcon icon={Alert01Icon} strokeWidth={2} className="mt-0.5 size-4 shrink-0" />
            <p>
              Browser ini tidak mendukung perintah suara. Semua soal tetap bisa dikerjakan dengan
              mengetuk jawaban.
            </p>
          </div>
        )}
        {!vq.online && (
          <div
            className="flex items-start gap-3 rounded-2xl bg-red-50 p-4 text-sm text-red-700 ring-1 ring-red-200"
            role="alert"
          >
            <HugeiconsIcon icon={Alert01Icon} strokeWidth={2} className="mt-0.5 size-4 shrink-0" />
            <p>Kamu offline — perintah suara butuh internet. Jawaban manual tetap berfungsi.</p>
          </div>
        )}
        {vq.micError && (
          <div
            className="flex items-start gap-3 rounded-2xl bg-red-50 p-4 text-sm text-red-700 ring-1 ring-red-200"
            role="alert"
          >
            <HugeiconsIcon icon={Alert01Icon} strokeWidth={2} className="mt-0.5 size-4 shrink-0" />
            <p>{vq.micError}</p>
          </div>
        )}
        {vq.failCount >= 2 && vq.phase === "question" && (
          <div className="flex items-start gap-2 rounded-2xl bg-white p-3 text-sm text-slate-600 ring-1 ring-slate-200">
            <HugeiconsIcon
              icon={Idea01Icon}
              strokeWidth={2}
              className="mt-0.5 size-4 shrink-0 text-blue-700"
            />
            <p>
              Suara susah ditangkap? Langsung ketuk saja jawabannya di bawah — poinnya sama.
            </p>
          </div>
        )}
        {vq.pendingDestructive && (
          <div
            className="flex flex-wrap items-center gap-3 rounded-2xl bg-amber-50 p-4 text-sm text-amber-900 ring-1 ring-amber-200"
            role="alertdialog"
            aria-label="Konfirmasi"
          >
            <span className="flex flex-1 items-center gap-2 font-semibold">
              <HugeiconsIcon
                icon={Alert01Icon}
                strokeWidth={2}
                className="size-4 shrink-0 text-amber-600"
              />
              {vq.pendingDestructive === "restart"
                ? "Yakin mulai ulang dari soal 1? Poin hangus."
                : "Yakin berhenti dan keluar?"}
            </span>
            <Button
              size="sm"
              className="rounded-xl bg-blue-700 font-bold text-white hover:bg-blue-800"
              onClick={() => vq.handleCommand("ya")}
            >
              Ya
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="rounded-xl"
              onClick={() => vq.handleCommand("tidak")}
            >
              Tidak
            </Button>
          </div>
        )}

        {vq.q && vq.phase !== "result" && vq.phase !== "scoreboard" && (
          <div className="relative mt-3">
            <div className="absolute -top-3.5 left-1/2 z-10 -translate-x-1/2">
              <Badge className="border-0 bg-blue-700 px-4 py-1 text-sm font-extrabold text-white tabular-nums hover:bg-blue-700">
                {vq.qIndex + 1} / {total}
              </Badge>
            </div>
            <div className="rounded-3xl bg-white px-5 pt-8 pb-5 text-center shadow-xs ring-1 ring-slate-200">
              <p className="text-[11px] font-bold tracking-widest text-slate-400 uppercase">
                {quiz.subject}
              </p>
              <h1
                ref={qHeadingRef}
                tabIndex={-1}
                className="mx-auto mt-1 max-w-3xl text-xl leading-snug font-extrabold text-slate-900 outline-none md:text-2xl"
              >
                {vq.q.question}
              </h1>
              {vq.phase === "question" && (
                <div className="mx-auto mt-3 max-w-xs">
                  <TimerBar
                    timeLeft={vq.timeLeft}
                    timeLimit={quiz.timeLimit}
                    enabled={vq.timerEnabled}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {vq.q && vq.phase === "question" && (
          <>
            <OptionGrid
              question={vq.q}
              selected={vq.selected}
              given={null}
              revealed={false}
              onSelect={(i) => {
                vq.setSelected(i);
                vq.speak(
                  `Kamu pilih ${vq.q?.options[i]}. Tekan Kunci Jawaban, atau ucapkan jawab.`
                );
              }}
            />
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2">
                <AvatarChip name={identity.name} avatarUrl={identity.avatarUrl} size="sm" />
              </div>
              <div className="ml-auto flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  onClick={() => vq.q && vq.readQuestion(vq.qIndex)}
                  className="rounded-2xl bg-white"
                >
                  <HugeiconsIcon icon={Idea01Icon} strokeWidth={2} /> Bacakan
                </Button>
                <Button
                  variant="outline"
                  onClick={vq.prev}
                  disabled={vq.qIndex === 0}
                  className="rounded-2xl bg-white disabled:opacity-40"
                >
                  <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} /> Sebelumnya
                </Button>
                <Button
                  size="lg"
                  disabled={vq.selected == null}
                  onClick={vq.submit}
                  className="rounded-2xl bg-blue-700 font-extrabold text-white hover:bg-blue-800 disabled:opacity-40 active:scale-95"
                >
                  <HugeiconsIcon icon={Tick02Icon} strokeWidth={2.5} />
                  Kunci{vq.selected != null ? `: ${OPTION_LETTERS[vq.selected]}` : ""}
                </Button>
              </div>
            </div>
          </>
        )}

        {vq.q && vq.phase === "reveal" && (
          <>
            <OptionGrid
              question={vq.q}
              selected={null}
              given={vq.answers[vq.qIndex] ?? vq.selected}
              revealed
              onSelect={() => vq.speak("Jawaban sudah dikunci. Ucapkan lanjut.")}
            />
            <AnswerReveal
              question={vq.q}
              given={vq.answers[vq.qIndex] ?? vq.selected}
              earned={vq.pointsEarned[vq.qIndex] ?? 0}
              timedOut={vq.timedOut}
              onNext={vq.next}
            />
          </>
        )}

        {vq.phase === "scoreboard" && (
          <Scoreboard
            totalPoints={vq.totalPoints}
            correctCount={vq.correctCount}
            total={total}
            streak={vq.streak}
            best={vq.best}
            isLast={vq.qIndex + 1 >= total}
            onAdvance={vq.advance}
          />
        )}

        {vq.phase === "result" && (
          <div className="grid items-start gap-4 lg:grid-cols-5">
            <div className="flex flex-col gap-4 lg:col-span-3">
              <Podium
                playerName={identity.name}
                totalPoints={vq.totalPoints}
                correctCount={vq.correctCount}
                total={total}
                best={vq.best}
                isNewBest={vq.isNewBest}
                onRestart={vq.start}
                onExit={onExit}
              />
              <ResultStats
                correctCount={vq.correctCount}
                total={total}
                timePerQuestion={quiz.timeLimit}
                streak={vq.streak}
              />
              <ReviewList
                questions={quiz.questions}
                answers={vq.answers}
                correct={vq.correct}
                pointsEarned={vq.pointsEarned}
              />
            </div>
            <aside className="flex flex-col gap-4 lg:col-span-2">
              <div className={`rounded-3xl ${subjectBg} p-5 text-white shadow-xs`}>
                <p className="text-xs font-bold tracking-widest text-white/80 uppercase">
                  {quiz.subject}
                </p>
                <p className="mt-1 text-lg leading-snug font-extrabold">{quiz.title}</p>
                <p className="mt-1 text-xs text-white/85">{quiz.description}</p>
                <div className="mt-3 flex items-center gap-2 text-xs font-semibold">
                  <AvatarChip name={identity.name} avatarUrl={identity.avatarUrl} size="sm" />
                  {vq.best && (
                    <span className="ml-auto rounded-lg bg-black/20 px-2 py-1 tabular-nums">
                      Terbaik: {vq.best.points.toLocaleString("id-ID")}
                    </span>
                  )}
                </div>
              </div>
              <div className="rounded-3xl bg-white p-5 shadow-xs ring-1 ring-slate-200">
                <p className="text-sm font-bold text-slate-800">Jangan berhenti di sini!</p>
                <p className="mt-1 text-xs text-slate-500">
                  Ucapkan &ldquo;mulai ulang&rdquo; untuk main lagi, atau ketuk tombol di atas.
                  Perintah suara tetap aktif di halaman ini.
                </p>
                <Button
                  onClick={vq.start}
                  className="mt-3 w-full rounded-2xl bg-blue-700 font-extrabold text-white hover:bg-blue-800"
                >
                  Mainkan Lagi
                </Button>
              </div>
            </aside>
          </div>
        )}

        <VoiceDock vq={vq} />
      </div>
    </div>
  );
}
