"use client";

import { useEffect, useRef, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  Refresh01Icon,
  Cancel01Icon,
  Tick02Icon,
  BookOpen02Icon,
  GameController01Icon,
  Idea01Icon,
  Alert01Icon,
  CheckmarkCircle01Icon,
} from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { QUIZZES } from "@/features/student-quiz/questions";
import { useVoiceQuiz } from "@/features/student-quiz/use-voice-quiz";

const OPTION_STYLES = [
  "bg-red-500 hover:bg-red-600 border-red-700",
  "bg-blue-600 hover:bg-blue-700 border-blue-800",
  "bg-amber-500 hover:bg-amber-600 border-amber-700",
  "bg-emerald-600 hover:bg-emerald-700 border-emerald-800",
];
const OPTION_LETTERS = ["A", "B", "C", "D"];

function MicSvg({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <rect x="9" y="2" width="6" height="12" rx="3" />
      <path d="M5 10a7 7 0 0 0 14 0" />
      <path d="M12 17v4" />
    </svg>
  );
}

function SpeakerSvg({ className, off }: { className?: string; off?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M11 5 6 9H2v6h4l5 4V5z" />
      {off ? <path d="m22 9-6 6M16 9l6 6" /> : <path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" />}
    </svg>
  );
}

export default function StudentPage() {
  const [activeId, setActiveId] = useState<string | null>(null);
  const activeQuiz = QUIZZES.find((q) => q.id === activeId) ?? null;
  const vq = useVoiceQuiz(activeQuiz);
  const listenOnce = vq.listenOnce;
  const qHeadingRef = useRef<HTMLHeadingElement>(null);
  const startedRef = useRef<string | null>(null);

  useEffect(() => {
    if (activeQuiz && startedRef.current !== activeQuiz.id) {
      startedRef.current = activeQuiz.id;
      vq.start();
      qHeadingRef.current?.focus();
    }
    if (!activeQuiz) startedRef.current = null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeQuiz?.id]);
  useEffect(() => {
    qHeadingRef.current?.focus();
  }, [vq.qIndex, vq.phase]);

  useEffect(() => {
    if (!activeQuiz) return;
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
  }, [activeQuiz, listenOnce]);

  function exitQuiz() {
    vq.resetToLobby();
    setActiveId(null);
  }

  /* ---------- RUNNER ---------- */
  if (activeQuiz && vq.q) {
    const total = activeQuiz.questions.length;
    const pct = Math.round(((vq.qIndex + (vq.phase === "result" ? 1 : 0)) / total) * 100);
    const lastCorrect = vq.correct[vq.qIndex];

    return (
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-4 py-4 md:py-6">
          <div className="px-4 lg:px-6 max-w-4xl w-full mx-auto flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon-sm" onClick={exitQuiz} aria-label="Keluar dari kuis">
                <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} />
              </Button>
              <div className="flex-1" role="progressbar" aria-valuenow={vq.qIndex + 1} aria-valuemin={1} aria-valuemax={total} aria-label={`Soal ${vq.qIndex + 1} dari ${total}`}>
                <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full bg-blue-700 transition-all" style={{ width: `${Math.max(pct, 8)}%` }} />
                </div>
              </div>
              <Badge variant="secondary">Soal {vq.qIndex + 1}/{total}</Badge>
              <Badge>Skor {vq.score}</Badge>
            </div>

            {!vq.support.stt && (
              <div className="flex gap-2 items-start rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900" role="alert">
                <HugeiconsIcon icon={Alert01Icon} strokeWidth={2} className="mt-0.5 shrink-0" />
                <p>Browser ini tidak mendukung perintah suara. Semua soal tetap bisa dikerjakan dengan mengetuk jawaban.</p>
              </div>
            )}
            {!vq.online && (
              <div className="flex gap-2 items-start rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-900" role="alert">
                <HugeiconsIcon icon={Alert01Icon} strokeWidth={2} className="mt-0.5 shrink-0" />
                <p>Kamu offline — perintah suara butuh internet. Jawaban manual tetap berfungsi.</p>
              </div>
            )}
            {vq.micError && (
              <div className="flex gap-2 items-start rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-900" role="alert">
                <HugeiconsIcon icon={Alert01Icon} strokeWidth={2} className="mt-0.5 shrink-0" />
                <p>{vq.micError}</p>
              </div>
            )}
            {vq.failCount >= 2 && vq.phase === "question" && (
              <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">
                Suara susah ditangkap? Langsung ketuk saja jawabannya di bawah — sama sahnya.
              </div>
            )}
            {vq.pendingDestructive && (
              <div className="flex flex-wrap items-center gap-2 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm" role="alertdialog" aria-label="Konfirmasi">
                <span className="font-medium">{vq.pendingDestructive === "restart" ? "Yakin mulai ulang dari soal 1?" : "Yakin berhenti dan keluar?"}</span>
                <Button size="sm" onClick={() => vq.handleCommand("ya")}>Ya</Button>
                <Button size="sm" variant="outline" onClick={() => vq.handleCommand("tidak")}>Tidak</Button>
              </div>
            )}

            {vq.phase !== "result" && (
              <Card className={`bg-linear-to-b ${activeQuiz.cover} text-white border-0`}>
                <CardContent className="pt-6 pb-6">
                  <p className="text-xs font-semibold tracking-widest uppercase text-white/70">{activeQuiz.subject} • Soal {vq.qIndex + 1}</p>
                  <h1 ref={qHeadingRef} tabIndex={-1} className="mt-1 text-xl md:text-2xl font-bold leading-snug outline-none">
                    {vq.q.question}
                  </h1>
                  <p className="mt-2 text-xs text-white/70">Ketuk jawaban, atau tahan tombol mic / tekan Spasi lalu ucapkan “satu…empat”.</p>
                </CardContent>
              </Card>
            )}

            {vq.phase === "question" && (
              <fieldset>
                <legend className="sr-only">Pilihan jawaban soal {vq.qIndex + 1}</legend>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" role="group" aria-label="Pilihan jawaban">
                  {vq.q.options.map((opt, i) => {
                    const sel = vq.selected === i;
                    return (
                      <button
                        key={i}
                        type="button"
                        aria-pressed={sel}
                        aria-label={`Pilihan ${OPTION_LETTERS[i]}: ${opt}${sel ? ", dipilih" : ""}`}
                        onClick={() => {
                          vq.setSelected(i);
                          vq.speak(`Kamu pilih ${opt}. Tekan Kunci Jawaban, atau ucapkan jawab.`);
                        }}
                        className={`min-h-20 rounded-2xl border-b-4 p-4 text-left text-white font-semibold shadow-md transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 ${OPTION_STYLES[i]} ${sel ? "ring-4 ring-white ring-offset-2 ring-offset-background scale-[1.01]" : "opacity-95"}`}
                      >
                        <span className="flex items-center gap-3">
                          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white/20 text-lg font-extrabold" aria-hidden="true">{OPTION_LETTERS[i]}</span>
                          <span className="text-base leading-snug">{opt}</span>
                          {sel && <HugeiconsIcon icon={Tick02Icon} strokeWidth={2.5} className="ml-auto shrink-0" />}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            )}

            {vq.phase === "question" && (
              <div className="flex flex-wrap gap-2">
                <Button size="lg" disabled={vq.selected == null} onClick={vq.submit} className="bg-blue-700 hover:bg-blue-800">
                  <HugeiconsIcon icon={Tick02Icon} strokeWidth={2.5} /> Kunci Jawaban{vq.selected != null ? `: ${OPTION_LETTERS[vq.selected]}` : ""}
                </Button>
                <Button variant="outline" onClick={() => vq.readQuestion(vq.qIndex)}>
                  <HugeiconsIcon icon={Idea01Icon} strokeWidth={2} /> Bacakan Soal
                </Button>
                <Button variant="outline" onClick={vq.prev} disabled={vq.qIndex === 0}>
                  <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} /> Sebelumnya
                </Button>
              </div>
            )}

            {vq.phase === "feedback" && (
              <Card className={lastCorrect ? "border-emerald-300 bg-emerald-50" : "border-red-300 bg-red-50"}>
                <CardContent className="pt-5 flex gap-3">
                  <HugeiconsIcon icon={lastCorrect ? CheckmarkCircle01Icon : Alert01Icon} strokeWidth={2} className={`mt-0.5 shrink-0 ${lastCorrect ? "text-emerald-700" : "text-red-700"}`} />
                  <div>
                    <p className={`font-bold ${lastCorrect ? "text-emerald-900" : "text-red-900"}`}>{lastCorrect ? "Benar! Hebat." : `Kurang tepat. Jawaban benar: ${vq.q.options[vq.q.answerIndex]}`}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{vq.q.explanation}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button onClick={vq.next} className="bg-blue-700 hover:bg-blue-800">
                        {vq.qIndex + 1 >= total ? "Lihat Skor" : "Soal Berikutnya"} <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} />
                      </Button>
                      <Button variant="outline" onClick={() => vq.readQuestion(vq.qIndex)}>Ulangi</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {vq.phase === "result" && (
              <Card className="text-center">
                <CardHeader>
                  <div className="mx-auto flex size-20 items-center justify-center rounded-full bg-blue-700 text-white text-2xl font-extrabold" aria-label={`Skor ${vq.score} dari ${total}`}>
                    {vq.score}/{total}
                  </div>
                  <CardTitle className="mt-2 text-xl">
                    {vq.score === total ? "Sempurna! Kamu bintang kelas." : vq.score >= Math.ceil(total / 2) ? "Bagus! Terus latihan ya." : "Tidak apa-apa, coba lagi yuk."}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap justify-center gap-2 pb-6">
                  <Button onClick={vq.start} className="bg-blue-700 hover:bg-blue-800">
                    <HugeiconsIcon icon={Refresh01Icon} strokeWidth={2} /> Mulai Ulang
                  </Button>
                  <Button variant="outline" onClick={exitQuiz}>
                    <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} /> Selesai
                  </Button>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardContent className="pt-4 flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={vq.listenOnce}
                    disabled={!vq.support.stt || vq.listening}
                    aria-label={vq.listening ? "Mendengarkan, silakan bicara" : "Tekan untuk bicara"}
                    className={`flex size-16 shrink-0 items-center justify-center rounded-full text-white shadow-lg transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 disabled:opacity-40 ${vq.listening ? "bg-red-600 animate-pulse scale-105" : "bg-blue-700 hover:bg-blue-800"}`}
                  >
                    <MicSvg className="size-7" />
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold" aria-hidden="true">
                      {vq.listening ? "Mendengarkan… silakan bicara" : "Ketuk mic / tekan Spasi, lalu bicara"}
                    </p>
                    <p className="truncate text-xs text-muted-foreground" aria-hidden="true">
                      {vq.transcript ? `Terakhir: “${vq.transcript}”` : "Coba: “mulai”, “dua”, “jawab”, “berikutnya”, “bantuan”"}
                    </p>
                    <div role="status" aria-live="polite" className="sr-only">{vq.liveMessage}</div>
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground md:hidden">{vq.liveMessage}</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={vq.help}>Bantuan suara</Button>
                </div>

                <div className="flex flex-wrap items-center gap-2 border-t pt-3">
                  <button
                    type="button"
                    onClick={() => vq.setTtsEnabled(!vq.ttsEnabled)}
                    aria-pressed={vq.ttsEnabled}
                    aria-label={vq.ttsEnabled ? "Matikan suara bawaan" : "Nyalakan suara bawaan"}
                    className="inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium hover:bg-muted"
                  >
                    <SpeakerSvg className="size-4" off={!vq.ttsEnabled} />
                    Suara: {vq.ttsEnabled ? "Nyala" : "Mati (mode screen reader)"}
                  </button>
                  <div className="inline-flex items-center gap-1 text-xs" role="group" aria-label="Kecepatan bicara">
                    <span className="text-muted-foreground">Tempo:</span>
                    {([["Lambat", 0.75], ["Normal", 1], ["Cepat", 1.25]] as const).map(([label, val]) => (
                      <button
                        key={label}
                        type="button"
                        onClick={() => vq.setRate(val)}
                        aria-pressed={vq.rate === val}
                        className={`rounded-md px-2 py-1 font-medium ${vq.rate === val ? "bg-blue-700 text-white" : "border hover:bg-muted"}`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  <Button variant="ghost" size="sm" onClick={vq.sayScore}>Skor saya</Button>
                  <Button variant="ghost" size="sm" onClick={vq.stopSpeak}>Hentikan suara</Button>
                </div>

                <details className="rounded-lg bg-muted/60 px-3 py-2 text-xs">
                  <summary className="cursor-pointer font-semibold">Daftar perintah suara</summary>
                  <ul className="mt-1.5 grid gap-1 sm:grid-cols-2">
                    {[
                      ["mulai", "mulai kuis"], ["satu / A / isi opsi", "pilih jawaban"], ["jawab", "kunci jawaban"],
                      ["berikutnya / lanjut", "soal berikutnya"], ["sebelumnya", "soal sebelumnya"], ["ulangi", "bacakan ulang"],
                      ["skor saya", "cek skor"], ["bantuan", "daftar perintah"], ["mulai ulang", "ulang (konfirmasi)"],
                      ["berhenti / selesai", "keluar (konfirmasi)"], ["ya / tidak", "jawab konfirmasi"], ["Spasi / ketuk mic", "aktivasi mic"],
                    ].map(([a, b]) => (
                      <li key={a} className="flex gap-1.5"><code className="font-bold text-blue-700">“{a}”</code><span className="text-muted-foreground">— {b}</span></li>
                    ))}
                  </ul>
                </details>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <div className="px-4 lg:px-6">
            <h1 className="text-2xl font-semibold tracking-tight">Beranda Siswa BISA</h1>
            <p className="text-sm text-muted-foreground mt-1 max-w-3xl">
              Pilih kuis dan kerjakan dengan cara favoritmu — <span className="font-medium text-foreground">ketuk jawaban</span> atau{" "}
              <span className="font-medium text-foreground">pakai suara penuh</span> (mic / tombol Spasi).
            </p>
          </div>

          <div className="px-4 lg:px-6">
            <Card className="bg-gradient-to-r from-blue-700 to-blue-900 text-white border-0">
              <CardContent className="flex flex-wrap items-center gap-3 py-4">
                <span className="flex size-10 items-center justify-center rounded-xl bg-white/15" aria-hidden="true"><MicSvg className="size-5" /></span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm">Mode suara siap: tanpa sentuh layar pun bisa.</p>
                  <p className="text-xs text-blue-100">Buka kuis → dengarkan soal → ucapkan “dua” → “jawab” → “berikutnya”. Ucapkan “bantuan” kapan saja.</p>
                </div>
                <Badge className="bg-white text-blue-800 hover:bg-white">id-ID • tap-to-talk</Badge>
              </CardContent>
            </Card>
          </div>

          <div className="px-4 lg:px-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3" role="list" aria-label="Daftar kuis">
            {QUIZZES.map((quiz) => (
              <Card key={quiz.id} role="listitem" className="overflow-hidden pt-0 hover:shadow-lg transition-shadow">
                <div className={`bg-gradient-to-br ${quiz.cover} px-4 pt-5 pb-8 text-white`}>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-white/20 text-white hover:bg-white/20 border-0">{quiz.subject}</Badge>
                    <span className="text-xs text-white/80">{quiz.questions.length} soal • suara + ketuk</span>
                  </div>
                  <h2 className="mt-2 text-lg font-bold leading-tight">{quiz.title}</h2>
                  <p className="mt-1 text-xs text-white/80 line-clamp-2">{quiz.description}</p>
                </div>
                <CardContent className="-mt-5">
                  <div className="rounded-xl border bg-card p-3 shadow-sm flex items-center gap-2">
                    <span className="flex size-9 items-center justify-center rounded-lg bg-blue-50 text-blue-700" aria-hidden="true">
                      <HugeiconsIcon icon={quiz.subject === "Matematika" ? GameController01Icon : BookOpen02Icon} size={18} strokeWidth={1.8} />
                    </span>
                    <p className="text-xs text-muted-foreground flex-1">Soal dibacakan otomatis. Jawab via suara atau ketukan.</p>
                    <Button size="sm" className="bg-blue-700 hover:bg-blue-800" onClick={() => setActiveId(quiz.id)}>
                      Mainkan
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
