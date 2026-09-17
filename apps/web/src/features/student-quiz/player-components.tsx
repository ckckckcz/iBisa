"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import {
  Tick02Icon,
  ArrowRight01Icon,
  Refresh01Icon,
  Cancel01Icon,
  TrophyIcon,
  StarIcon,
  FireIcon,
  Award01Icon,
  CheckmarkCircle01Icon,
  Timer01Icon,
  ChartBarIncreasingIcon,
  VolumeMute01Icon,
  VolumeHighIcon,
  ListChecksIcon,
  SnailIcon,
  RabbitIcon,
  MedalFirstPlaceIcon,
  SmileIcon,
  Clock01Icon,
  Menu01Icon,
  HelpCircleIcon,
} from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { QuizQuestion } from "@/types/questions";
import type { useVoiceQuiz } from "@/hooks/use-voice-quiz";
import { NEURAL_VOICES } from "@/hooks/use-voice-quiz";
import { SHOW_DUMMY_DATA } from "@/lib/flags";

export { useFullscreen } from "../../hooks/use-fullscreen";
export { AvatarChip } from "./avatar-chip";

export const OPTION_STYLES = [
  "bg-red-500 hover:bg-red-400 border-red-700",
  "bg-blue-600 hover:bg-blue-500 border-blue-800",
  "bg-amber-400 hover:bg-amber-300 border-amber-600",
  "bg-emerald-400 hover:bg-emerald-300 border-emerald-600",
] as const;

export const OPTION_TEXT: string[] = [
  "text-white",
  "text-white",
  "text-amber-950",
  "text-emerald-950",
];

export const OPTION_LETTERS = ["A", "B", "C", "D"];
export type VQ = ReturnType<typeof useVoiceQuiz>;

export function VoiceSettings({ vq }: { vq: VQ }) {
  const value = vq.neural ? `neural:${vq.neuralVoice}` : `sys:${vq.voiceURI}`;
  return (
    <div className="inline-flex items-center gap-1 rounded-xl bg-slate-100 p-1">
      <select
        value={value}
        onChange={(e) => {
          const v = e.target.value;
          if (v.startsWith("neural:")) {
            vq.setNeural(true);
            vq.setNeuralVoice(v.slice(7));
          } else {
            vq.setNeural(false);
            vq.setVoiceURI(v.slice(4));
          }
        }}
        aria-label="Pilih suara"
        title="Pilih suara"
        className="max-w-40 cursor-pointer rounded-lg bg-transparent px-2 py-1.5 text-xs font-semibold text-slate-600 outline-none hover:bg-slate-200"
      >
        <optgroup label="Suara AI (natural)">
          {NEURAL_VOICES.map((n) => (
            <option key={n.key} value={`neural:${n.key}`}>
              AI · {n.label}
            </option>
          ))}
        </optgroup>
        {vq.sysVoices.length > 0 && (
          <optgroup label="Suara perangkat">
            {vq.sysVoices.map((s) => (
              <option key={s.voiceURI} value={`sys:${s.voiceURI}`}>
                {s.name}
              </option>
            ))}
          </optgroup>
        )}
      </select>
      {!vq.neural && (
        <input
          type="range"
          min={0.5}
          max={1.5}
          step={0.1}
          value={vq.pitch}
          onChange={(e) => vq.setPitch(Number(e.target.value))}
          aria-label="Nada suara"
          title={`Nada: ${vq.pitch.toFixed(1)}`}
          className="w-20 accent-blue-700"
        />
      )}
    </div>
  );
}

export function MicSvg({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect x="9" y="2" width="6" height="12" rx="3" />
      <path d="M5 10a7 7 0 0 0 14 0" />
      <path d="M12 17v4" />
    </svg>
  );
}

export function CountdownOverlay({
  value,
  onSkip,
}: {
  value: number;
  onSkip: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-white/95 backdrop-blur"
      role="alert"
      aria-live="assertive"
      aria-label={value > 0 ? `Mulai dalam ${value}` : "Mulai"}
    >
      <p className="text-sm font-bold tracking-widest text-slate-500 uppercase">
        Bersiap…
      </p>
      <p
        key={value}
        className="text-[8rem] leading-none font-extrabold text-blue-700 tabular-nums"
        style={{ animation: "pop-in 0.45s cubic-bezier(0.34,1.56,0.64,1)" }}
        aria-hidden="true"
      >
        {value > 0 ? value : "GO!"}
      </p>
      <Button variant="outline" size="sm" onClick={onSkip} className="rounded-xl">
        Lewati hitung mundur
      </Button>
    </div>
  );
}

export function TimerBar({
  timeLeft,
  timeLimit,
  enabled,
}: {
  timeLeft: number;
  timeLimit: number;
  enabled: boolean;
}) {
  if (!enabled) {
    return (
      <Badge className="border-0 bg-slate-100 text-slate-600 hover:bg-slate-100">
        <HugeiconsIcon icon={Timer01Icon} size={12} strokeWidth={2} className="mr-1" />
        Tanpa timer
      </Badge>
    );
  }

  const frac = Math.max(0, Math.min(1, timeLeft / timeLimit));
  const urgent = timeLeft <= 10;

  return (
    <div
      className="flex min-w-28 flex-1 items-center gap-2 sm:max-w-52"
      role="timer"
      aria-label={`Sisa waktu ${timeLeft} detik dari ${timeLimit} detik`}
    >
      <span
        className={`w-8 text-right text-lg font-extrabold tabular-nums ${
          urgent ? "text-red-600" : "text-slate-700"
        }`}
        aria-hidden="true"
      >
        {timeLeft}
      </span>
      <div className="h-3 flex-1 overflow-hidden rounded-full bg-slate-200" aria-hidden="true">
        <div
          className={`h-full rounded-full transition-[width] duration-300 ${
            urgent ? "bg-red-500" : "bg-blue-700"
          }`}
          style={{ width: `${Math.max(frac * 100, 3)}%` }}
        />
      </div>
    </div>
  );
}

export function AnswerReveal({
  question,
  given,
  earned,
  timedOut,
  onNext,
}: {
  question: QuizQuestion;
  given: number | null;
  earned: number;
  timedOut: boolean;
  onNext: () => void;
}) {
  const ok = given != null && given === question.answerIndex;

  return (
    <div className="rounded-3xl bg-white p-5 shadow-xs ring-1 ring-slate-200">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-base font-extrabold ${
            ok ? "bg-emerald-500 text-white" : "bg-red-500 text-white"
          }`}
        >
          <HugeiconsIcon
            icon={ok ? CheckmarkCircle01Icon : Cancel01Icon}
            size={18}
            strokeWidth={2.5}
          />
          {ok
            ? `Benar! +${earned}`
            : timedOut && given == null
            ? "Waktu habis! +0"
            : "Kurang tepat! +0"}
        </span>
        {!ok && given != null && given >= 0 && (
          <span className="text-sm text-slate-600">
            Jawabanmu: {question.options[given]}
          </span>
        )}
      </div>
      <p className="mt-3 text-sm leading-relaxed">
        <span className={`font-semibold ${ok ? "text-emerald-700" : "text-red-700"}`}>
          Jawaban benar: {question.options[question.answerIndex]}.{" "}
        </span>
        <span className="text-slate-600">{question.explanation}</span>
      </p>
      <Button
        onClick={onNext}
        className="mt-4 rounded-2xl bg-blue-700 font-extrabold text-white hover:bg-blue-800 active:scale-95"
      >
        Lanjut <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2.5} />
      </Button>
    </div>
  );
}

export function Scoreboard({
  totalPoints,
  correctCount,
  total,
  streak,
  best,
  isLast,
  onAdvance,
}: {
  totalPoints: number;
  correctCount: number;
  total: number;
  streak: number;
  best: { points: number; correct: number } | null;
  isLast: boolean;
  onAdvance: () => void;
}) {
  return (
    <div className="rounded-3xl bg-white p-6 text-center shadow-xs ring-1 ring-slate-200">
      <p className="text-xs font-bold tracking-widest text-slate-500 uppercase">
        Papan Skor
      </p>
      <p className="mt-2 text-6xl font-extrabold text-blue-700 tabular-nums">
        {totalPoints.toLocaleString("id-ID")}
      </p>
      <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
        <Badge className="border-0 bg-slate-100 text-slate-700 hover:bg-slate-100">
          <HugeiconsIcon icon={CheckmarkCircle01Icon} size={12} strokeWidth={2} className="mr-1" />
          {correctCount}/{total} benar
        </Badge>
        {streak >= 2 && (
          <Badge className="flex items-center gap-1 border-0 bg-orange-100 font-extrabold text-orange-700 hover:bg-orange-100">
            <HugeiconsIcon icon={FireIcon} size={12} strokeWidth={2} />
            Streak x{streak}
          </Badge>
        )}
        {best && (
          <Badge className="flex items-center gap-1 border-0 bg-amber-100 text-amber-800 hover:bg-amber-100">
            <HugeiconsIcon icon={StarIcon} size={12} strokeWidth={2} />
            Rekor: {best.points.toLocaleString("id-ID")}
          </Badge>
        )}
      </div>
      <Button
        onClick={onAdvance}
        size="lg"
        className="mt-6 rounded-2xl bg-blue-700 font-extrabold text-white hover:bg-blue-800 active:scale-95"
      >
        {isLast ? (
          <>
            <HugeiconsIcon icon={TrophyIcon} strokeWidth={2} />
            Lihat Hasil Akhir
          </>
        ) : (
          "Soal Berikutnya"
        )}{" "}
        <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2.5} />
      </Button>
    </div>
  );
}

export function Podium({
  playerName,
  totalPoints,
  correctCount,
  total,
  best,
  isNewBest,
  onRestart,
  onExit,
}: {
  playerName: string;
  totalPoints: number;
  correctCount: number;
  total: number;
  best: { points: number; correct: number } | null;
  isNewBest: boolean;
  onRestart: () => void;
  onExit: () => void;
}) {
  const perfect = correctCount === total;
  const good = correctCount >= Math.ceil(total / 2);
  const nilai = total === 0 ? 0 : Math.round((correctCount / total) * 100);

  const ResultIcon = perfect ? TrophyIcon : good ? MedalFirstPlaceIcon : SmileIcon;
  const resultIconBg = perfect
    ? "bg-amber-400 text-amber-950"
    : good
    ? "bg-blue-700 text-white"
    : "bg-slate-300 text-slate-600";

  const resultMessage = perfect
    ? "Remarkable win, keep it up!"
    : good
    ? "Bagus! Terus latihan ya."
    : "Tidak apa-apa, coba lagi yuk!";

  return (
    <div className="rounded-3xl bg-white p-8 text-center shadow-xs ring-1 ring-slate-200">
      <div
        className={`mx-auto flex size-28 items-center justify-center rounded-full ${resultIconBg} shadow-sm`}
        aria-label={`${correctCount} dari ${total} soal benar`}
      >
        <HugeiconsIcon icon={ResultIcon} className="size-14" strokeWidth={1.5} />
      </div>

      {isNewBest && (
        <Badge className="mx-auto mt-3 flex w-fit items-center justify-center gap-1 border-0 bg-amber-400 text-sm font-extrabold text-amber-950 hover:bg-amber-400">
          <HugeiconsIcon icon={Award01Icon} size={14} strokeWidth={2} />
          Rekor Baru!
        </Badge>
      )}

      <div className="mx-auto mt-6 grid w-full max-w-sm grid-cols-2 gap-3">
        <div className="rounded-2xl bg-emerald-50 p-4 text-center ring-1 ring-emerald-100">
          <p className="text-[11px] font-bold tracking-widest text-slate-500 uppercase">Nilai</p>
          <p className="mt-1 text-4xl font-extrabold text-emerald-600 tabular-nums">{nilai}</p>
        </div>
        <div className="rounded-2xl bg-blue-50 p-4 text-center ring-1 ring-blue-100">
          <p className="text-[11px] font-bold tracking-widest text-slate-500 uppercase">Poin</p>
          <p className="mt-1 text-4xl font-extrabold text-blue-700 tabular-nums">
            {totalPoints.toLocaleString("id-ID")}
          </p>
        </div>
      </div>

      <p className="mt-5 text-2xl font-bold text-slate-800">
        Hebat, {playerName.trim() || "Pemain"}!
      </p>

      <p className="mt-1 text-sm font-semibold text-slate-600">
        {correctCount}/{total} jawaban benar
      </p>

      <p className="mt-2 text-sm text-slate-500">
        {resultMessage}
        {best && !isNewBest && (
          <> Skor terbaikmu: {best.points.toLocaleString("id-ID")} poin.</>
        )}
      </p>

      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Button
          onClick={onRestart}
          size="lg"
          className="rounded-2xl bg-blue-700 font-extrabold text-white hover:bg-blue-800 active:scale-95"
        >
          <HugeiconsIcon icon={Refresh01Icon} strokeWidth={2.5} /> Mainkan Lagi
        </Button>
        <Button
          variant="outline"
          size="lg"
          onClick={onExit}
          className="rounded-2xl active:scale-95"
        >
          <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} /> Kuis Lain
        </Button>
      </div>
    </div>
  );
}

export function ResultStats({
  correctCount,
  total,
  streak,
}: {
  correctCount: number;
  total: number;
  streak: number;
}) {
  const incorrect = total - correctCount;
  const pct = total === 0 ? 0 : Math.round((correctCount / total) * 100);

  return (
    <div className="flex flex-col gap-4">
      <section aria-label="Akurasi" className="rounded-3xl bg-white p-5 shadow-xs ring-1 ring-slate-200">
        <h3 className="flex items-center gap-1.5 text-sm font-bold text-slate-800">
          Akurasi
          <span className="text-slate-400" title="Persentase jawaban benar">
            <HugeiconsIcon icon={HelpCircleIcon} size={14} strokeWidth={2} />
          </span>
        </h3>
        <div className="mt-3 flex items-center gap-2">
          <div
            className="h-3 flex-1 overflow-hidden rounded-full bg-slate-200"
            role="progressbar"
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Akurasi ${pct} persen`}
          >
            <div className="h-full rounded-full bg-emerald-500" style={{ width: `${pct}%` }} />
          </div>
          <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-xs font-extrabold text-slate-700 tabular-nums">
            {pct}%
          </span>
        </div>
      </section>

      <section aria-label="Statistik performa" className="rounded-3xl bg-white p-5 shadow-xs ring-1 ring-slate-200">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800">Performance Stats</h3>
          <span className="text-xs text-slate-500">{total} questions</span>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Badge className="border-0 bg-emerald-100 px-3 py-1.5 font-bold text-emerald-800 hover:bg-emerald-100">
            <HugeiconsIcon icon={Tick02Icon} size={13} strokeWidth={2.5} className="mr-1" />
            {correctCount} Correct
          </Badge>
          <Badge className="border-0 bg-red-100 px-3 py-1.5 font-bold text-red-700 hover:bg-red-100">
            <HugeiconsIcon icon={Cancel01Icon} size={13} strokeWidth={2} className="mr-1" />
            {incorrect} Salah
          </Badge>
          {SHOW_DUMMY_DATA && (
            <Badge className="border-0 bg-sky-100 px-3 py-1.5 font-bold text-sky-800 hover:bg-sky-100">
              <HugeiconsIcon icon={Clock01Icon} size={13} strokeWidth={2} className="mr-1" />
              Waktu/soal
            </Badge>
          )}
          <Badge className="border-0 bg-orange-100 px-3 py-1.5 font-bold text-orange-700 hover:bg-orange-100">
            <HugeiconsIcon icon={FireIcon} size={13} strokeWidth={2} className="mr-1" />
            Streak {streak}
          </Badge>
        </div>
      </section>
    </div>
  );
}

export function ReviewList({
  questions,
  answers,
  correct,
  pointsEarned,
}: {
  questions: QuizQuestion[];
  answers: number[];
  correct: boolean[];
  pointsEarned: number[];
}) {
  return (
    <section aria-label="Review soal" className="rounded-3xl bg-white p-5 shadow-xs ring-1 ring-slate-200">
      <h3 className="text-sm font-bold text-slate-800">Review Questions</h3>
      <p className="text-xs text-slate-500">Klik soal untuk melihat jawaban</p>
      <div className="mt-3 flex flex-col gap-2">
        {questions.map((item, i) => {
          const ok = correct[i] ?? false;
          const given = answers[i] ?? -1;
          return (
            <details key={item.id} className="overflow-hidden rounded-2xl ring-1 ring-slate-200">
              <summary className="flex cursor-pointer items-center gap-2 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800 marker:hidden hover:bg-slate-100">
                <span
                  className={`flex size-6 shrink-0 items-center justify-center rounded-full ${
                    ok ? "bg-emerald-500 text-white" : "bg-red-500 text-white"
                  }`}
                  aria-hidden="true"
                >
                  <HugeiconsIcon icon={ok ? Tick02Icon : Cancel01Icon} size={13} strokeWidth={2.5} />
                </span>
                <span className="line-clamp-1">
                  {i + 1}. {item.question}
                </span>
                <span className="ml-auto shrink-0 text-xs font-bold text-blue-700 tabular-nums">
                  +{pointsEarned[i] ?? 0}
                </span>
              </summary>
              <div className="border-t border-slate-100 px-4 py-3">
                <ul className="flex flex-col gap-1.5">
                  {item.options.map((opt, oi) => {
                    const isKey = oi === item.answerIndex;
                    const isGiven = oi === given;
                    return (
                      <li
                        key={oi}
                        className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm ${
                          isKey
                            ? "bg-emerald-50 font-bold text-emerald-800 ring-1 ring-emerald-200"
                            : isGiven
                            ? "bg-red-50 font-semibold text-red-700 ring-1 ring-red-200"
                            : "text-slate-600"
                        }`}
                      >
                        <span className="font-extrabold text-slate-400">{OPTION_LETTERS[oi]}.</span>
                        {opt}
                        {isKey && <HugeiconsIcon icon={Tick02Icon} size={14} strokeWidth={2.5} className="ml-auto shrink-0" />}
                        {!isKey && isGiven && <span className="ml-auto shrink-0 text-xs">(jawabanmu)</span>}
                      </li>
                    );
                  })}
                </ul>
                <p className="mt-2 text-xs leading-relaxed text-slate-500">{item.explanation}</p>
              </div>
            </details>
          );
        })}
      </div>
    </section>
  );
}

export function VoiceDock({ vq }: { vq: VQ }) {
  return (
    <div className="mt-auto rounded-3xl bg-white p-5 shadow-xs ring-1 ring-slate-200">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={vq.listenOnce}
          disabled={!vq.support.stt || vq.listening}
          aria-label={vq.listening ? "Mendengarkan, silakan bicara" : "Tekan untuk bicara"}
          className={`flex size-16 shrink-0 items-center justify-center rounded-2xl shadow-sm transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 disabled:opacity-40 ${
            vq.listening
              ? "scale-105 animate-pulse bg-red-500 text-white"
              : "bg-blue-700 text-white hover:bg-blue-800 active:scale-95"
          }`}
        >
          <MicSvg className="size-7" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-slate-900" aria-hidden="true">
            {vq.listening ? "Mendengarkan… silakan bicara" : "Ketuk mic atau tekan Spasi"}
          </p>
          <p className="truncate text-xs text-slate-500" aria-hidden="true">
            {vq.transcript
              ? `Terakhir: "${vq.transcript}"`
              : 'Coba: "dua" → "jawab" → "berikutnya"'}
          </p>
          <div role="status" aria-live="polite" className="sr-only">
            {vq.liveMessage}
          </div>
        </div>
        <Button
          size="sm"
          onClick={vq.help}
          className="rounded-xl bg-blue-700 font-bold text-white hover:bg-blue-800"
        >
          Bantuan
        </Button>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
        <button
          type="button"
          onClick={() => vq.setTtsEnabled(!vq.ttsEnabled)}
          aria-pressed={vq.ttsEnabled}
          className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-colors ${
            vq.ttsEnabled
              ? "bg-blue-700 text-white"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          <HugeiconsIcon
            icon={vq.ttsEnabled ? VolumeHighIcon : VolumeMute01Icon}
            size={14}
            strokeWidth={2}
          />
          Suara: {vq.ttsEnabled ? "Nyala" : "Mati"}
        </button>

        <div
          className="inline-flex items-center gap-1 rounded-xl bg-slate-100 p-1"
          role="group"
          aria-label="Kecepatan bicara"
        >
          {(
            [
              ["Lambat", 0.75, SnailIcon],
              ["Normal", 1, null],
              ["Cepat", 1.25, RabbitIcon],
            ] as const
          ).map(([label, val, Icon]) => (
            <button
              key={label}
              type="button"
              onClick={() => vq.setRate(val)}
              aria-pressed={vq.rate === val}
              className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                vq.rate === val
                  ? "bg-blue-700 text-white"
                  : "text-slate-600 hover:bg-slate-200"
              }`}
            >
              {Icon && <HugeiconsIcon icon={Icon} size={12} strokeWidth={2} />}
              {label}
            </button>
          ))}
        </div>

        <VoiceSettings vq={vq} />

        <button
          type="button"
          onClick={() => vq.setTimerEnabled(!vq.timerEnabled)}
          aria-pressed={vq.timerEnabled}
          className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-colors ${
            vq.timerEnabled
              ? "bg-blue-700 text-white"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          <HugeiconsIcon icon={Timer01Icon} size={14} strokeWidth={2} />
          Timer: {vq.timerEnabled ? "Nyala" : "Mati"}
        </button>

        <button
          type="button"
          onClick={vq.sayScore}
          className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-200"
        >
          <HugeiconsIcon icon={ChartBarIncreasingIcon} size={14} strokeWidth={2} />
          Skor saya
        </button>

        <button
          type="button"
          onClick={vq.stopSpeak}
          className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-200"
        >
          <HugeiconsIcon icon={VolumeMute01Icon} size={14} strokeWidth={2} />
          Hentikan suara
        </button>
      </div>

      <details className="mt-3 rounded-2xl bg-slate-50 px-4 py-3 text-xs ring-1 ring-slate-100">
        <summary className="inline-flex cursor-pointer items-center gap-1.5 font-bold text-slate-700">
          <HugeiconsIcon icon={ListChecksIcon} size={14} strokeWidth={2} />
          Daftar perintah suara
        </summary>
        <ul className="mt-2 grid gap-1.5 sm:grid-cols-2">
          {[
            ["satu / A / isi opsi", "pilih jawaban"],
            ["jawab", "kunci jawaban"],
            ["berikutnya / lanjut", "lanjut"],
            ["waktu", "cek sisa waktu"],
            ["poin", "cek poin + streak"],
            ["ulangi", "bacakan ulang"],
            ["tanpa timer", "matikan timer"],
            ["bantuan", "daftar perintah"],
            ["mulai ulang", "ulang (konfirmasi)"],
            ["selesai", "keluar (konfirmasi)"],
            ["ya / tidak", "jawab konfirmasi"],
            ["Spasi / ketuk mic", "aktivasi mic"],
          ].map(([a, b]) => (
            <li key={a} className="flex gap-1.5">
              <code className="font-bold text-blue-700">&ldquo;{a}&rdquo;</code>
              <span className="text-slate-500">— {b}</span>
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}

export function VoiceMenu({ vq, onExit }: { vq: VQ; onExit: () => void }) {
  return (
    <details className="relative">
      <summary
        aria-label="Menu pengaturan"
        className="flex size-9 cursor-pointer list-none items-center justify-center rounded-xl bg-white text-slate-600 ring-1 ring-slate-200 transition-colors marker:hidden hover:bg-slate-100 [&::-webkit-details-marker]:hidden"
      >
        <HugeiconsIcon icon={Menu01Icon} size={18} strokeWidth={2} />
      </summary>
      <div className="absolute top-11 right-0 z-50 w-60 rounded-2xl bg-white p-3 shadow-xl ring-1 ring-slate-200">
        <p className="px-2 pt-1 text-[11px] font-bold tracking-widest text-slate-400 uppercase">
          Pengaturan Suara
        </p>
        <button
          type="button"
          onClick={() => vq.setTtsEnabled(!vq.ttsEnabled)}
          className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
        >
          <HugeiconsIcon
            icon={vq.ttsEnabled ? VolumeHighIcon : VolumeMute01Icon}
            size={16}
            strokeWidth={2}
          />
          Suara: {vq.ttsEnabled ? "Nyala" : "Mati"}
        </button>
        <div className="px-1 py-1">
          <VoiceSettings vq={vq} />
        </div>
        <button
          type="button"
          onClick={() => vq.setTimerEnabled(!vq.timerEnabled)}
          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
        >
          <HugeiconsIcon icon={Timer01Icon} size={16} strokeWidth={2} />
          Timer: {vq.timerEnabled ? "Nyala" : "Mati"}
        </button>
        <button
          type="button"
          onClick={vq.help}
          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
        >
          <HugeiconsIcon icon={HelpCircleIcon} size={16} strokeWidth={2} />
          Bantuan suara
        </button>
        <div className="my-2 border-t border-slate-100" />
        <button
          type="button"
          onClick={onExit}
          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
        >
          <HugeiconsIcon icon={Cancel01Icon} size={16} strokeWidth={2} />
          Keluar dari kuis
        </button>
      </div>
    </details>
  );
}

export function OptionGrid({
  question,
  selected,
  given,
  revealed,
  onSelect,
  disabled,
}: {
  question: QuizQuestion;
  selected: number | null;
  given: number | null;
  revealed: boolean;
  onSelect: (i: number) => void;
  disabled?: boolean;
}) {
  return (
    <fieldset disabled={disabled}>
      <legend className="sr-only">Pilihan jawaban</legend>
      <div
        className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4"
        role="group"
        aria-label="Pilihan jawaban"
      >
        {question.options.map((opt, i) => {
          const isGiven = given === i;
          const isCorrect = revealed && i === question.answerIndex;
          const isWrong = revealed && isGiven && !isCorrect;
          const sel = !revealed && selected === i;

          return (
            <button
              key={i}
              type="button"
              aria-pressed={sel}
              aria-label={`Pilihan ${OPTION_LETTERS[i]}: ${opt}${
                isCorrect ? ", jawaban benar" : ""
              }${isWrong ? ", jawabanmu, salah" : ""}${sel ? ", dipilih" : ""}`}
              onClick={() => onSelect(i)}
              className={[
                "relative min-h-28 rounded-2xl border-b-4 p-4 pt-8 text-center font-bold shadow-xs transition-all lg:min-h-40 lg:pt-10",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700",
                OPTION_STYLES[i],
                OPTION_TEXT[i],
                revealed && !isCorrect && !isWrong ? "opacity-40 saturate-50" : "",
                sel ? "scale-[1.02] ring-4 ring-blue-700 ring-offset-2 ring-offset-slate-100" : "",
                isCorrect ? "scale-[1.02] ring-4 ring-emerald-600 ring-offset-2 ring-offset-slate-100" : "",
                isWrong ? "opacity-70 saturate-50" : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              <span
                className="absolute top-2 right-2 flex size-7 items-center justify-center rounded-lg bg-black/20 text-sm font-extrabold"
                aria-hidden="true"
              >
                {i + 1}
              </span>
              <span className="text-base leading-snug lg:text-lg">{opt}</span>
              {(sel || isCorrect) && (
                <span className="absolute bottom-2 left-1/2 -translate-x-1/2" aria-hidden="true">
                  <HugeiconsIcon icon={Tick02Icon} strokeWidth={2.5} className="size-5" />
                </span>
              )}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
