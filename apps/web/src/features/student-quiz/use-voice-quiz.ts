"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Quiz } from "./questions";

export type VoicePhase = "idle" | "question" | "feedback" | "result";
export type SpeechRate = 0.75 | 1 | 1.25;
type PendingDestructive = "restart" | "stop" | null;

type RecogCtor = new () => {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((e: { results: { [i: number]: { [j: number]: { transcript: string } } } }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

function getRecogCtor(): RecogCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as Record<string, unknown>;
  return (w.SpeechRecognition as RecogCtor) ?? (w.webkitSpeechRecognition as RecogCtor) ?? null;
}

const NUM_WORDS: Record<string, number> = {
  satu: 0, "1": 0, a: 0, pertama: 0, kesatu: 0,
  dua: 1, "2": 1, b: 1, kedua: 1,
  tiga: 2, "3": 2, c: 2, ketiga: 2,
  empat: 3, "4": 3, d: 3, keempat: 3,
};

function matchOptionIndex(t: string, options: string[]): number | null {
  const norm = ` ${t.toLowerCase().trim()} `;
  for (const [word, idx] of Object.entries(NUM_WORDS)) {
    const re = new RegExp(`(^|\\W)${word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(\\W|$)`, "i");
    if (re.test(norm) || norm.includes(`opsi ${word}`) || norm.includes(`jawaban ${word}`) || norm.includes(`pilihan ${word}`) || norm.includes(`huruf ${word}`) || norm.includes(`nomor ${word}`)) {
      return idx;
    }
  }

  const low = t.toLowerCase();
  for (let i = 0; i < options.length; i++) {
    const opt = options[i].toLowerCase();
    if (low.includes(opt) || (low.length >= 4 && opt.includes(low))) return i;
  }
  return null;
}

const has = (t: string, ...keys: string[]) => keys.some((k) => t.includes(k));

export function useVoiceQuiz(quiz: Quiz | null) {
  const [phase, setPhase] = useState<VoicePhase>("idle");
  const [qIndex, setQIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [locked, setLocked] = useState<boolean[]>([]);
  const [correct, setCorrect] = useState<boolean[]>([]);
  const [failCount, setFailCount] = useState(0);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [liveMessage, setLiveMessage] = useState("Selamat datang di kuis suara BISA.");
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [rate, setRate] = useState<SpeechRate>(1);
  const [pendingDestructive, setPendingDestructive] = useState<PendingDestructive>(null);
  const [micError, setMicError] = useState<string | null>(null);
  const [online, setOnline] = useState(() => (typeof navigator === "undefined" ? true : navigator.onLine));

  const [support] = useState(() => ({
    stt: getRecogCtor() !== null,
    tts: typeof window !== "undefined" && "speechSynthesis" in window,
  }));

  const stateRef = useRef({ phase, qIndex, selected, pendingDestructive, locked });
  const ttsRef = useRef({ enabled: ttsEnabled, rate });
  const recogRef = useRef<{ stop: () => void; abort: () => void } | null>(null);

  useEffect(() => {
    stateRef.current = { phase, qIndex, selected, pendingDestructive, locked };
    ttsRef.current = { enabled: ttsEnabled, rate };
  });

  const score = correct.filter(Boolean).length;
  const q = quiz?.questions[qIndex] ?? null;

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  const speak = useCallback((text: string) => {
    setLiveMessage(text);
    if (!ttsRef.current.enabled) return;
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "id-ID";
    u.rate = ttsRef.current.rate;
    window.speechSynthesis.speak(u);
  }, []);

  const stopSpeak = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
  }, []);

  const readQuestion = useCallback(
    (idx: number) => {
      if (!quiz) return;
      const item = quiz.questions[idx];
      const opts = item.options.map((o, i) => `Pilihan ${i + 1}: ${o}.`).join(" ");
      speak(`Soal ${idx + 1} dari ${quiz.questions.length}. ${item.question} ${opts} Ucapkan satu, dua, tiga, atau empat untuk memilih.`);
    },
    [quiz, speak]
  );

  const start = useCallback(() => {
    if (!quiz) return;
    stopSpeak();
    setQIndex(0);
    setSelected(null);
    setLocked(new Array(quiz.questions.length).fill(false));
    setCorrect(new Array(quiz.questions.length).fill(false));
    setFailCount(0);
    setPendingDestructive(null);
    setPhase("question");
  }, [quiz, stopSpeak]);

  useEffect(() => {
    if (!quiz) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (phase === "question") readQuestion(qIndex);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase === "question" ? qIndex : null, phase, quiz?.id]);

  const submit = useCallback(() => {
    const s = stateRef.current;
    if (!quiz || s.phase !== "question" || s.selected == null || s.locked[s.qIndex]) return;
    const item = quiz.questions[s.qIndex];
    const ok = s.selected === item.answerIndex;
    setLocked((p) => {
      const n = [...p];
      n[s.qIndex] = true;
      return n;
    });
    setCorrect((p) => {
      const n = [...p];
      n[s.qIndex] = ok;
      return n;
    });
    setPhase("feedback");
    const total = correct.filter(Boolean).length + (ok ? 1 : 0);
    speak(
      ok
        ? `Benar! ${item.explanation} Skor kamu ${total}. Ucapkan berikutnya untuk lanjut, atau ulangi untuk dengar lagi.`
        : `Kurang tepat. Jawaban yang benar: ${item.options[item.answerIndex]}. ${item.explanation} Ucapkan berikutnya untuk lanjut.`
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quiz, speak]);

  const next = useCallback(() => {
    const s = stateRef.current;
    if (!quiz) return;
    if (s.qIndex + 1 >= quiz.questions.length) {
      setPhase("result");
      const total = correct.filter(Boolean).length;
      speak(
        `Kuis selesai! Skor akhir kamu ${total} dari ${quiz.questions.length} soal. Ucapkan mulai ulang untuk mengulang, atau selesai untuk keluar.`
      );
    } else {
      setQIndex(s.qIndex + 1);
      setSelected(null);
      setPhase("question");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quiz, speak]);

  const prev = useCallback(() => {
    const s = stateRef.current;
    if (s.qIndex === 0) {
      speak("Ini sudah soal pertama.");
      return;
    }
    setQIndex(s.qIndex - 1);
    setSelected(null);
    setPhase("feedback");
    const wasLocked = s.locked[s.qIndex - 1];
    if (wasLocked) speak(`Soal ${s.qIndex}. Jawaban soal ini sudah dikunci, tidak bisa diubah. Ucapkan berikutnya untuk kembali.`);
    else {
      setPhase("question");
    }
  }, [speak]);

  const resetToLobby = useCallback(() => {
    stopSpeak();
    setPhase("idle");
    setQIndex(0);
    setSelected(null);
    setPendingDestructive(null);
    setFailCount(0);
    speak("Kamu keluar dari kuis. Sampai jumpa!");
  }, [speak, stopSpeak]);

  const help = useCallback(() => {
    speak(
      "Perintah yang tersedia: ucapkan satu sampai empat untuk memilih jawaban. Ucapkan jawab untuk mengunci. Berikutnya untuk lanjut, sebelumnya untuk mundur, ulangi untuk dengar soal lagi, skor saya untuk cek skor, bantuan untuk dengar ini lagi, mulai ulang untuk mengulang, selesai untuk keluar."
    );
  }, [speak]);

  const sayScore = useCallback(() => {
    if (!quiz) return;
    const total = correct.filter(Boolean).length;
    speak(`Skor kamu ${total} dari ${quiz.questions.length} soal. Sekarang di soal ${qIndex + 1}.`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quiz, qIndex, speak]);

  const unknown = useCallback(
    (heard: string) => {
      const n = failCount + 1;
      setFailCount(n);
      const hint =
        stateRef.current.phase === "question"
          ? "Ucapkan satu, dua, tiga, atau empat untuk memilih. Lalu ucapkan jawab."
          : stateRef.current.phase === "feedback"
            ? "Ucapkan berikutnya untuk lanjut, atau ulangi."
            : stateRef.current.phase === "result"
              ? "Ucapkan mulai ulang atau selesai."
              : "Ucapkan mulai untuk mulai kuis, atau bantuan.";
      speak(
        (heard ? `Maaf, saya mendengar "${heard}" tapi tidak mengerti. ` : "Maaf, saya tidak mendengar dengan jelas. ") +
          hint +
          (n >= 2 ? " Kalau susah, kamu bisa langsung ketuk jawabannya di layar." : "")
      );
    },
    [failCount, speak]
  );

  const handleCommand = useCallback(
    (raw: string) => {
      const t = raw.toLowerCase().trim();
      if (!t) {
        unknown("");
        return;
      }
      const s = stateRef.current;

      if (s.pendingDestructive) {
        if (has(t, "ya", "iya", "betul", "yakin", "jawab")) {
          const kind = s.pendingDestructive;
          setPendingDestructive(null);
          if (kind === "restart") start();
          else resetToLobby();
          return;
        }
        if (has(t, "tidak", "batal", "nggak", "enggak", "jangan")) {
          setPendingDestructive(null);
          speak("Baik, dibatalkan. Lanjut seperti semula.");
          return;
        }
        speak('Jawab "ya" untuk lanjut, atau "tidak" untuk batal.');
        return;
      }

      // global
      if (has(t, "bantuan", "help", "perintah")) return help();
      if (has(t, "skor")) return sayScore();
      if (has(t, "ulangi quiz", "mulai ulang", "ulang quiz")) {
        setPendingDestructive("restart");
        speak('Yakin mau mulai ulang dari soal pertama? Jawab "ya" atau "tidak".');
        return;
      }
      if (has(t, "berhenti", "selesai", "keluar", "stop")) {
        if (s.phase === "idle") return resetToLobby();
        setPendingDestructive("stop");
        speak('Yakin mau berhenti dan keluar dari kuis? Jawab "ya" atau "tidak".');
        return;
      }
      if (has(t, "ulangi", "ulang", "ulangi soal")) {
        if (!quiz) return;
        if (s.phase === "question") return readQuestion(s.qIndex);
        if (s.phase === "feedback") {
          const item = quiz.questions[s.qIndex];
          speak(`${item.question} Jawaban benar: ${item.options[item.answerIndex]}. ${item.explanation}`);
          return;
        }
        return unknown(t);
      }

      if (s.phase === "idle") {
        if (has(t, "mulai", "start", "ayo", "jalan")) return start();
        return unknown(t);
      }

      if (s.phase === "question") {
        if (has(t, "berikut", "lanjut", "next", "lewat")) {
          speak("Kunci dulu jawabanmu. Ucapkan jawab untuk mengunci, atau pilih dulu opsinya.");
          return;
        }
        if (has(t, "sebelum", "kembali", "mundur")) return prev();
        if (has(t, "jawab", "kunci", "kirim", "yakin") && s.selected != null) return submit();
        if (has(t, "jawab", "kunci") && s.selected == null) {
          speak("Belum ada pilihan. Ucapkan dulu satu sampai empat.");
          return;
        }
        if (quiz) {
          const idx = matchOptionIndex(t, quiz.questions[s.qIndex].options);
          if (idx != null) {
            setSelected(idx);
            setFailCount(0);
            speak(`Kamu pilih ${quiz.questions[s.qIndex].options[idx]}. Ucapkan jawab untuk mengunci, atau pilih yang lain.`);
            return;
          }
        }
        return unknown(t);
      }

      if (s.phase === "feedback") {
        if (has(t, "berikut", "lanjut", "next")) return next();
        if (has(t, "sebelum", "kembali", "mundur")) return prev();
        return unknown(t);
      }

      if (s.phase === "result") {
        if (has(t, "mulai", "ulang")) {
          setPendingDestructive("restart");
          speak('Yakin mau mulai ulang? Jawab "ya" atau "tidak".');
          return;
        }
        return unknown(t);
      }
    },
    [quiz, help, sayScore, start, submit, next, prev, resetToLobby, readQuestion, unknown, speak]
  );

  const listenOnce = useCallback(() => {
    const Ctor = getRecogCtor();
    if (!Ctor) {
      setMicError("Browser ini tidak mendukung perintah suara. Kamu tetap bisa kerjakan kuis dengan mengetuk jawaban di layar.");
      speak("Browser ini tidak mendukung perintah suara. Gunakan tombol di layar, semua tetap bisa dikerjakan manual.");
      return;
    }
    if (!online) {
      setMicError("Kamu sedang offline. Perintah suara butuh internet, tapi jawaban manual tetap bisa dipakai.");
      speak("Kamu sedang offline. Perintah suara butuh internet. Silakan ketuk jawaban manual.");
      return;
    }
    try {
      stopSpeak();
      recogRef.current?.abort();
      const rec = new Ctor();
      rec.lang = "id-ID";
      rec.continuous = false;
      rec.interimResults = false;
      rec.maxAlternatives = 1;
      recogRef.current = rec;
      setListening(true);
      setMicError(null);
      rec.onresult = (e) => {
        const heard = e.results[0]?.[0]?.transcript ?? "";
        setTranscript(heard);
        setListening(false);
        handleCommand(heard);
      };
      rec.onerror = (e) => {
        setListening(false);
        if (e.error === "not-allowed" || e.error === "service-not-allowed") {
          setMicError("Izin mikrofon ditolak. Aktifkan izin mic di pengaturan browser, atau lanjutkan dengan ketuk jawaban manual.");
          speak("Izin mikrofon ditolak. Aktifkan izin mic di pengaturan browser, atau ketuk jawaban manual.");
        } else if (e.error === "no-speech" || e.error === "audio-capture") {
          unknown("");
        } else if (e.error === "network") {
          setMicError("Jaringan bermasalah, suara butuh internet. Coba lagi atau pakai tombol manual.");
          speak("Jaringan bermasalah. Coba lagi atau pakai tombol manual.");
        } else {
          unknown("");
        }
      };
      rec.onend = () => setListening(false);
      rec.start();
    } catch {
      setListening(false);
      unknown("");
    }
  }, [handleCommand, online, speak, stopSpeak, unknown]);

  useEffect(() => () => {
    recogRef.current?.abort();
    if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
  }, []);

  return {
    phase, qIndex, q, selected, locked, correct, score, failCount,
    listening, transcript, liveMessage, ttsEnabled, rate, pendingDestructive,
    micError, online, support,
    setSelected, setTtsEnabled, setRate,
    speak, stopSpeak, listenOnce, handleCommand,
    start, submit, next, prev, resetToLobby, help, sayScore, readQuestion,
  };
}
