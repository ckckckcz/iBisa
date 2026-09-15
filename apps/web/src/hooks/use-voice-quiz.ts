"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Quiz } from "@/types/questions";

export type VoicePhase = "idle" | "countdown" | "question" | "reveal" | "scoreboard" | "result";
export type SpeechRate = 0.75 | 1 | 1.25;
type PendingDestructive = "restart" | "stop" | null;
export type QuizBest = { points: number; correct: number };

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

function loadBest(quizId: string | undefined): QuizBest | null {
  if (typeof window === "undefined" || !quizId) return null;
  try {
    const raw = localStorage.getItem(`bisa-quiz-best-${quizId}`);
    return raw ? (JSON.parse(raw) as QuizBest) : null;
  } catch {
    return null;
  }
}

export function useVoiceQuiz(quiz: Quiz | null) {
  const [phase, setPhase] = useState<VoicePhase>("idle");
  const [countdown, setCountdown] = useState(3);
  const [qIndex, setQIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [locked, setLocked] = useState<boolean[]>([]);
  const [correct, setCorrect] = useState<boolean[]>([]);
  const [answers, setAnswers] = useState<number[]>([]);
  const [pointsEarned, setPointsEarned] = useState<number[]>([]);
  const [streak, setStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [timerEnabled, setTimerEnabled] = useState(true);
  const [timedOut, setTimedOut] = useState(false);
  const [best, setBest] = useState<QuizBest | null>(() => loadBest(quiz?.id));
  const [isNewBest, setIsNewBest] = useState(false);
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

  const stateRef = useRef({ phase, qIndex, selected, locked, pendingDestructive, timeLeft, streak, timerEnabled });
  const ttsRef = useRef({ enabled: ttsEnabled, rate });
  const recogRef = useRef<{ stop: () => void; abort: () => void } | null>(null);
  const lockAnswerRef = useRef<(given: number | null, expired: boolean) => void>(() => {});

  useEffect(() => {
    stateRef.current = { phase, qIndex, selected, locked, pendingDestructive, timeLeft, streak, timerEnabled };
    ttsRef.current = { enabled: ttsEnabled, rate };
  });

  const totalPoints = pointsEarned.reduce((a, b) => a + b, 0);
  const correctCount = correct.filter(Boolean).length;
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
      const opts = item.options.map((o: string, i: number) => `Pilihan ${i + 1}: ${o}.`).join(" ");
      const limit = stateRef.current.timerEnabled ? quiz.timeLimit : 0;
      speak(
        `Soal ${idx + 1} dari ${quiz.questions.length}${limit > 0 ? `, waktu ${limit} detik` : ", tanpa batas waktu"}. ${item.question} ${opts} Ucapkan satu, dua, tiga, atau empat untuk memilih.`
      );
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
    setAnswers(new Array(quiz.questions.length).fill(-1));
    setPointsEarned(new Array(quiz.questions.length).fill(0));
    setStreak(0);
    setTimedOut(false);
    setFailCount(0);
    setPendingDestructive(null);
    setIsNewBest(false);
    setBest(loadBest(quiz.id));
    setCountdown(3);
    setPhase("countdown");
    speak("Bersiap! Tiga.");
  }, [quiz, speak, stopSpeak]);

  useEffect(() => {
    if (phase !== "countdown") return;
    const id = window.setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          window.clearInterval(id);
          setPhase("question");
          speak("Mulai!");
          return 0;
        }
        speak(c - 1 === 2 ? "Dua." : "Satu.");
        return c - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [phase, speak]);

  useEffect(() => {
    if (!quiz) return;
    if (phase === "question") readQuestion(qIndex);
  }, [phase, qIndex, quiz, readQuestion]);

  useEffect(() => {
    if (phase !== "question" || !quiz || !stateRef.current.timerEnabled) return;
    const limit = quiz.timeLimit;
    setTimeLeft(limit);
    setTimedOut(false);
    const deadline = Date.now() + limit * 1000;
    let warned = false;
    const id = window.setInterval(() => {
      const remain = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setTimeLeft(remain);
      if (remain === 10 && !warned) {
        warned = true;
        speak("Waktu tinggal 10 detik.");
      }
      if (remain <= 0) {
        window.clearInterval(id);
        lockAnswerRef.current(stateRef.current.selected, true);
      }
    }, 250);
    return () => window.clearInterval(id);
  }, [phase, qIndex, timerEnabled, quiz, speak]);

  const revealSummary = useCallback(
    (idx: number) => {
      if (!quiz) return "";
      const item = quiz.questions[idx];
      const s = stateRef.current;
      const given = answers[idx] ?? s.selected;
      const ok = correct[idx] ?? false;
      const timed = given == null || given < 0;
      return ok
        ? `Benar! ${item.explanation} Kamu dapat ${pointsEarned[idx] ?? 0} poin. Ucapkan berikutnya.`
        : timed
          ? `Waktu habis. Jawaban yang benar: ${item.options[item.answerIndex]}. ${item.explanation} Ucapkan berikutnya.`
          : `Kurang tepat. Kamu jawab ${item.options[given]}. Jawaban benar: ${item.options[item.answerIndex]}. ${item.explanation} Ucapkan berikutnya.`;
    },
    [quiz, answers, correct, pointsEarned]
  );

  const lockAnswer = useCallback(
    (given: number | null, expired: boolean) => {
      const s = stateRef.current;
      if (!quiz || s.phase !== "question" || s.locked[s.qIndex]) return;
      const idx = s.qIndex;
      const item = quiz.questions[idx];
      const ok = given != null && given === item.answerIndex;
      const newStreak = ok ? s.streak + 1 : 0;
      const frac = s.timerEnabled ? Math.max(0, s.timeLeft / quiz.timeLimit) : 1;
      const earned = ok ? Math.round(quiz.basePoints * (0.6 + 0.4 * frac)) + Math.min(newStreak, 5) * 20 : 0;
      setLocked((p) => { const n = [...p]; n[idx] = true; return n; });
      setCorrect((p) => { const n = [...p]; n[idx] = ok; return n; });
      setAnswers((p) => { const n = [...p]; n[idx] = given ?? -1; return n; });
      setPointsEarned((p) => { const n = [...p]; n[idx] = earned; return n; });
      setStreak(newStreak);
      setTimedOut(expired && given == null);
      setPhase("reveal");
      const total = pointsEarned.reduce((a, b) => a + b, 0) + earned;
      speak(
        ok
          ? `Benar! ${item.explanation} Kamu dapat ${earned} poin.${newStreak >= 2 ? ` Streak ${newStreak} kali!` : ""} Total ${total} poin. Ucapkan berikutnya.`
          : expired && given == null
            ? `Waktu habis! Jawaban benar: ${item.options[item.answerIndex]}. ${item.explanation} Ucapkan berikutnya.`
            : `Kurang tepat. Jawaban benar: ${item.options[item.answerIndex]}. ${item.explanation} Ucapkan berikutnya.`
      );
    },
    [quiz, speak, pointsEarned]
  );

  useEffect(() => {
    lockAnswerRef.current = lockAnswer;
  });

  const submit = useCallback(() => {
    const s = stateRef.current;
    if (s.selected == null) {
      speak("Belum ada pilihan. Ucapkan dulu satu sampai empat.");
      return;
    }
    lockAnswer(s.selected, false);
  }, [lockAnswer, speak]);

  const maxLockedIndex = useCallback(() => {
    const l = stateRef.current.locked;
    let m = -1;
    l.forEach((v, i) => { if (v) m = i; });
    return m;
  }, []);

  const next = useCallback(() => {
    const s = stateRef.current;
    if (!quiz || (s.phase !== "reveal" && s.phase !== "question")) return;
    if (s.phase === "question" && !s.locked[s.qIndex]) {
      speak("Kunci dulu jawabanmu. Ucapkan jawab untuk mengunci, atau pilih dulu opsinya.");
      return;
    }
    if (s.qIndex < maxLockedIndex()) {
      const ni = s.qIndex + 1;
      setQIndex(ni);
      setSelected(answers[ni] ?? null);
      setPhase("reveal");
      speak(revealSummary(ni));
      return;
    }
    setPhase("scoreboard");
    const total = pointsEarned.reduce((a, b) => a + b, 0);
    const cc = correct.filter(Boolean).length;
    const last = s.qIndex + 1 >= quiz.questions.length;
    speak(
      `Papan skor: ${total} poin, ${cc} benar dari ${quiz.questions.length} soal, streak ${s.streak}. ` +
        (last ? "Ucapkan lanjut untuk lihat hasil akhir." : "Ucapkan lanjut untuk soal berikutnya.")
    );
  }, [quiz, speak, maxLockedIndex, revealSummary, answers, pointsEarned, correct]);

  const advance = useCallback(() => {
    const s = stateRef.current;
    if (!quiz) return;
    if (s.qIndex + 1 >= quiz.questions.length) {
      const total = pointsEarned.reduce((a, b) => a + b, 0);
      const cc = correct.filter(Boolean).length;
      const prevBest = loadBest(quiz.id);
      const record = !prevBest || total > prevBest.points;
      setIsNewBest(record && total > 0);
      if (record) {
        const nb = { points: total, correct: cc };
        setBest(nb);
        try { localStorage.setItem(`bisa-quiz-best-${quiz.id}`, JSON.stringify(nb)); } catch {}
      } else if (prevBest) {
        setBest(prevBest);
      }
      setPhase("result");
      speak(
        `Kuis selesai! Kamu dapat ${total} poin, ${cc} benar dari ${quiz.questions.length} soal. ` +
          (record && total > 0 ? "Rekor baru! Hebat sekali!" : "Bagus! ") +
          "Ucapkan mulai ulang untuk main lagi, atau selesai untuk keluar."
      );
    } else {
      setQIndex(s.qIndex + 1);
      setSelected(null);
      setPhase("question");
    }
  }, [quiz, speak, pointsEarned, correct]);

  const prev = useCallback(() => {
    const s = stateRef.current;
    if (!quiz) return;
    if (s.qIndex === 0) {
      speak("Ini sudah soal pertama.");
      return;
    }
    const ni = s.qIndex - 1;
    setQIndex(ni);
    setSelected(answers[ni] ?? null);
    setPhase("reveal");
    speak(`Soal ${ni + 1}, mode review. Jawaban sudah dikunci. ` + revealSummary(ni));
  }, [quiz, speak, answers, revealSummary]);

  const skipCountdown = useCallback(() => {
    if (stateRef.current.phase !== "countdown") return;
    stopSpeak();
    setPhase("question");
  }, [stopSpeak]);

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
      "Perintah yang tersedia: ucapkan satu sampai empat untuk memilih. Ucapkan jawab untuk mengunci. Berikutnya untuk lanjut. Waktu untuk cek sisa waktu. Poin untuk cek skor dan streak. Ulangi untuk dengar lagi. Bantuan untuk dengar ini lagi. Mulai ulang untuk mengulang. Selesai untuk keluar."
    );
  }, [speak]);

  const sayScore = useCallback(() => {
    if (!quiz) return;
    const total = pointsEarned.reduce((a, b) => a + b, 0);
    const cc = correct.filter(Boolean).length;
    speak(`Skor: ${cc} benar dari ${quiz.questions.length} soal, ${total} poin, streak ${stateRef.current.streak}. Sekarang di soal ${stateRef.current.qIndex + 1}.`);
  }, [quiz, speak, pointsEarned, correct]);

  const sayTime = useCallback(() => {
    const s = stateRef.current;
    if (s.phase !== "question") {
      speak("Timer hanya jalan saat soal tampil.");
      return;
    }
    if (!s.timerEnabled) {
      speak("Timer dimatikan untuk kuis ini. Santai, tidak ada batas waktu.");
      return;
    }
    speak(s.timeLeft > 0 ? `Sisa waktu ${s.timeLeft} detik.` : "Waktu hampir habis!");
  }, [speak]);

  const unknown = useCallback(
    (heard: string) => {
      const n = failCount + 1;
      setFailCount(n);
      const p = stateRef.current.phase;
      const hint =
        p === "question"
          ? "Ucapkan satu, dua, tiga, atau empat untuk memilih. Lalu ucapkan jawab."
          : p === "reveal"
            ? "Ucapkan berikutnya untuk lanjut."
            : p === "scoreboard"
              ? "Ucapkan lanjut untuk soal berikutnya."
              : p === "result"
                ? "Ucapkan mulai ulang atau selesai."
                : p === "countdown"
                  ? "Tunggu sebentar, kuis segera mulai."
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
        if (has(t, "ya", "iya", "betul", "yakin")) {
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

      if (has(t, "bantuan", "help", "perintah")) return help();
      if (has(t, "skor", "poin", "nilai", "streak")) return sayScore();
      if (has(t, "waktu", "sisa")) return sayTime();
      if (has(t, "tanpa timer", "matikan timer", "timer mati")) {
        setTimerEnabled(false);
        speak("Timer dimatikan. Kerjakan dengan santai, tanpa batas waktu.");
        return;
      }
      if (has(t, "nyalakan timer", "pakai timer", "timer nyala")) {
        setTimerEnabled(true);
        speak("Timer dinyalakan.");
        return;
      }
      if (has(t, "ulangi quiz", "mulai ulang", "ulang quiz", "main lagi")) {
        if (s.phase === "idle") return start();
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
      if (has(t, "ulangi", "ulang", "bacakan")) {
        if (!quiz) return;
        if (s.phase === "question") return readQuestion(s.qIndex);
        if (s.phase === "reveal") return speak(revealSummary(s.qIndex));
        if (s.phase === "scoreboard") {
          const total = pointsEarned.reduce((a, b) => a + b, 0);
          speak(`Papan skor: ${total} poin, streak ${s.streak}. Ucapkan lanjut.`);
          return;
        }
        return unknown(t);
      }

      if (s.phase === "idle") {
        if (has(t, "mulai", "start", "ayo", "jalan")) return start();
        return unknown(t);
      }
      if (s.phase === "countdown") {
        if (has(t, "lewati", "skip", "langsung")) return skipCountdown();
        return speak("Tunggu sebentar, kuis segera mulai.");
      }

      if (s.phase === "question") {
        if (has(t, "berikut", "lanjut", "next", "lewat")) {
          if (!s.locked[s.qIndex]) {
            speak("Kunci dulu jawabanmu. Ucapkan jawab untuk mengunci, atau pilih dulu opsinya.");
            return;
          }
          return next();
        }
        if (has(t, "sebelum", "kembali", "mundur")) return prev();
        if (has(t, "jawab", "kunci", "kirim", "yakin")) {
          if (s.selected != null) return submit();
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

      if (s.phase === "reveal") {
        if (has(t, "berikut", "lanjut", "next")) return next();
        if (has(t, "sebelum", "kembali", "mundur")) return prev();
        return unknown(t);
      }

      if (s.phase === "scoreboard") {
        if (has(t, "lanjut", "berikut", "next", "ayo", "gas")) return advance();
        if (has(t, "sebelum", "kembali", "mundur")) return prev();
        return unknown(t);
      }

      if (s.phase === "result") {
        if (has(t, "mulai", "ulang", "lagi")) {
          setPendingDestructive("restart");
          speak('Yakin mau mulai ulang? Jawab "ya" atau "tidak".');
          return;
        }
        return unknown(t);
      }
    },
    [quiz, help, sayScore, sayTime, start, submit, next, prev, advance, skipCountdown, resetToLobby, readQuestion, revealSummary, unknown, speak, pointsEarned]
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
    phase, countdown, qIndex, q, selected, locked, correct, answers, pointsEarned,
    streak, totalPoints, correctCount, timeLeft, timerEnabled, timedOut,
    best, isNewBest, failCount,
    listening, transcript, liveMessage, ttsEnabled, rate, pendingDestructive,
    micError, online, support,
    setSelected, setTtsEnabled, setRate, setTimerEnabled,
    speak, stopSpeak, listenOnce, handleCommand,
    start, submit, next, advance, prev, skipCountdown, resetToLobby, help, sayScore, sayTime, readQuestion,
  };
}
