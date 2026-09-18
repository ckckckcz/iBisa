"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Quiz } from "@/types/questions";
import { getValidToken } from "@/lib/ai-helpers";

export type VoicePhase = "idle" | "countdown" | "question" | "reveal" | "scoreboard" | "result";
export type SpeechRate = 0.75 | 1 | 1.25;

export type NeuralVoiceInfo = { key: string; label: string };

export const NEURAL_VOICES: NeuralVoiceInfo[] = [
  { key: "id-ID-GadisNeural", label: "Gadis · wanita" },
  { key: "id-ID-ArdiNeural", label: "Ardi · pria" },
];

const SILENT_WAV =
  "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=";

export type SystemVoiceInfo = { voiceURI: string; name: string; lang: string };

function loadStored(key: string, fallback: string): string {
  try {
    return localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}

function store(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {}
}

function loadNeuralDefault(): boolean {
  try {
    if (!localStorage.getItem("bisa-tts-default-device")) {
      localStorage.setItem("bisa-tts-default-device", "1");
      localStorage.setItem("bisa-tts-neural", "0");
      return false;
    }
    return localStorage.getItem("bisa-tts-neural") === "1";
  } catch {
    return false;
  }
}
type PendingDestructive = "restart" | "stop" | null;
export type QuizBest = { points: number; correct: number };

type RecogAlternative = { transcript: string };
type RecogResult = { isFinal: boolean; length: number; [j: number]: RecogAlternative };
type RecogEvent = { resultIndex: number; results: { length: number; [i: number]: RecogResult } };

type RecogCtor = new () => {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((e: RecogEvent) => void) | null;
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

const NUM_WORD_DIGITS: Record<string, string> = {
  sebelas: "11", "dua belas": "12", "tiga belas": "13", "empat belas": "14",
};

function matchOptionIndex(t: string, options: string[]): number | null {
  const low = t.toLowerCase().trim();
  const norm = ` ${low} `;
  for (const [word, idx] of Object.entries(NUM_WORDS)) {
    const re = new RegExp(`(^|\\W)${word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(\\W|$)`, "i");
    if (re.test(norm) || norm.includes(`opsi ${word}`) || norm.includes(`jawaban ${word}`) || norm.includes(`pilihan ${word}`) || norm.includes(`huruf ${word}`) || norm.includes(`nomor ${word}`)) {
      return idx;
    }
  }
  let numeric = low;
  for (const [word, digit] of Object.entries(NUM_WORD_DIGITS)) numeric = numeric.split(word).join(digit);
  for (const d of numeric.match(/\d/g) ?? []) {
    const n = Number(d);
    if (n >= 1 && n <= 4) return n - 1;
  }
  for (let i = 0; i < options.length; i++) {
    const opt = options[i].toLowerCase();
    if (low.includes(opt) || (low.length >= 4 && opt.includes(low))) return i;
  }
  return null;
}

const has = (t: string, ...keys: string[]) => keys.some((k) => t.includes(k));

const NEURAL_CHUNK_CHARS = 600;

function splitForSpeech(text: string, max = NEURAL_CHUNK_CHARS): string[] {
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) return [];
  if (clean.length <= max) return [clean];
  const sentences = clean.match(/[^.!?]+[.!?]*/g) ?? [clean];
  const chunks: string[] = [];
  let cur = "";
  for (const raw of sentences) {
    const s = raw.trim();
    if (!s) continue;
    if (cur && cur.length + 1 + s.length > max) { chunks.push(cur); cur = ""; }
    if (s.length > max) {
      if (cur) { chunks.push(cur); cur = ""; }
      for (let i = 0; i < s.length; i += max) chunks.push(s.slice(i, i + max));
    } else {
      cur = cur ? `${cur} ${s}` : s;
    }
  }
  if (cur) chunks.push(cur);
  return chunks;
}

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
  const [sysVoices, setSysVoices] = useState<SystemVoiceInfo[]>([]);
  const [voiceURI, setVoiceURIState] = useState(() => loadStored("bisa-tts-voice", ""));
  const [pitch, setPitchState] = useState(() => Number(loadStored("bisa-tts-pitch", "1")) || 1);
  const [neural, setNeuralState] = useState(() => loadNeuralDefault());
  const [neuralVoice, setNeuralVoiceState] = useState(() => loadStored("bisa-tts-neural-voice", "id-ID-GadisNeural"));
  const [neuralVoices, setNeuralVoices] = useState<NeuralVoiceInfo[]>(NEURAL_VOICES);
  const [isBrave, setIsBrave] = useState(() => typeof navigator !== "undefined" && /Brave/i.test(navigator.userAgent));

  const setVoiceURI = useCallback((v: string) => { setVoiceURIState(v); store("bisa-tts-voice", v); }, []);
  const setPitch = useCallback((p: number) => { setPitchState(p); store("bisa-tts-pitch", String(p)); }, []);
  const setNeural = useCallback((n: boolean) => { setNeuralState(n); store("bisa-tts-neural", n ? "1" : "0"); }, []);
  const setNeuralVoice = useCallback((v: string) => { setNeuralVoiceState(v); store("bisa-tts-neural-voice", v); }, []);
  const [pendingDestructive, setPendingDestructive] = useState<PendingDestructive>(null);
  const [micError, setMicError] = useState<string | null>(null);
  const [online, setOnline] = useState(() => (typeof navigator === "undefined" ? true : navigator.onLine));
  const [support] = useState(() => ({
    stt: getRecogCtor() !== null,
    tts: typeof window !== "undefined" && "speechSynthesis" in window,
  }));
  const activeNeuralVoice = neuralVoices.some((v) => v.key === neuralVoice)
    ? neuralVoice
    : neuralVoices[0]?.key ?? neuralVoice;
  const micSupported = support.stt && !isBrave;

  const stateRef = useRef({ phase, qIndex, selected, locked, pendingDestructive, timeLeft, streak, timerEnabled });
  const ttsRef = useRef({ enabled: ttsEnabled, rate, voiceURI, pitch, neural, neuralVoice: activeNeuralVoice });
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const neuralCache = useRef(new Map<string, Blob>());
  const speakSeq = useRef(0);
  const lastNarrationRef = useRef("");
  const onlineRef = useRef(online);
  const recogRef = useRef<{ stop: () => void; abort: () => void } | null>(null);
  const listenSeq = useRef(0);
  const listenTimer = useRef<number | null>(null);
  const lockAnswerRef = useRef<(given: number | null, expired: boolean) => void>(() => {});

  useEffect(() => {
    stateRef.current = { phase, qIndex, selected, locked, pendingDestructive, timeLeft, streak, timerEnabled };
    ttsRef.current = { enabled: ttsEnabled, rate, voiceURI, pitch, neural, neuralVoice: activeNeuralVoice };
    onlineRef.current = online;
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

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const syn = window.speechSynthesis;
    const load = () => {
      const all = syn.getVoices();
      const id = all.filter((v) => /^id/i.test(v.lang));
      setSysVoices(
        (id.length ? id : all).slice(0, 30).map((v) => ({ voiceURI: v.voiceURI, name: v.name, lang: v.lang }))
      );
    };
    load();
    syn.addEventListener("voiceschanged", load);
    return () => syn.removeEventListener("voiceschanged", load);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const token = await getValidToken();
        const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";
        const res = await fetch(`${apiUrl}/tts/voices`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) return;
        const data = (await res.json()) as { voices?: NeuralVoiceInfo[] };
        if (!cancelled && data.voices?.length) setNeuralVoices(data.voices);
      } catch {}
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const nav = navigator as Navigator & { brave?: { isBrave?: () => Promise<boolean> } };
    if (!nav.brave?.isBrave) return;
    let cancelled = false;
    nav.brave
      .isBrave()
      .then((b) => {
        if (!cancelled) setIsBrave(b);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const unlock = () => {
      try {
        const audio = new Audio(SILENT_WAV);
        audio.volume = 0;
        audio.play().catch(() => {});
      } catch {}
    };
    window.addEventListener("pointerdown", unlock, { once: true });
    return () => window.removeEventListener("pointerdown", unlock);
  }, []);

  const fetchChunk = useCallback(async (chunk: string, voice: string): Promise<Blob> => {
    const key = `${voice}:${chunk}`;
    const cached = neuralCache.current.get(key);
    if (cached) return cached;
    const token = await getValidToken();
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";
    const res = await fetch(`${apiUrl}/tts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ text: chunk, voice }),
    });
    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as { message?: string } | null;
      throw new Error(data?.message ?? `TTS gagal (${res.status})`);
    }
    const blob = await res.blob();
    if (!blob.size) throw new Error("TTS tidak mengembalikan audio");
    if (neuralCache.current.size >= 100) {
      const first = neuralCache.current.keys().next().value;
      if (first) neuralCache.current.delete(first);
    }
    neuralCache.current.set(key, blob);
    return blob;
  }, []);

  const halt = useCallback(() => {
    speakSeq.current += 1;
    const audio = audioRef.current;
    if (audio) {
      try { audio.pause(); } catch {}
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
  }, []);

  const speak = useCallback(
    (text: string) => {
      setLiveMessage(text);
      halt();
      if (!ttsRef.current.enabled) return;
      lastNarrationRef.current = text;
      const seq = ++speakSeq.current;

      const speakSystem = () => {
        if (seq !== speakSeq.current) return;
        if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text);
        u.lang = "id-ID";
        u.rate = ttsRef.current.rate;
        u.pitch = ttsRef.current.pitch;
        const match = window.speechSynthesis.getVoices().find((v) => v.voiceURI === ttsRef.current.voiceURI);
        if (match) u.voice = match;
        window.speechSynthesis.speak(u);
      };

      const speakNeural = async () => {
        const voice = ttsRef.current.neuralVoice;
        for (const chunk of splitForSpeech(text)) {
          if (seq !== speakSeq.current) return;
          const blob = await fetchChunk(chunk, voice);
          if (seq !== speakSeq.current) return;
          await new Promise<void>((resolve, reject) => {
            const audio = audioRef.current ?? new Audio();
            audioRef.current = audio;
            const url = URL.createObjectURL(blob);
            let settled = false;
            function cleanup() {
              audio.removeEventListener("ended", onEnded);
              audio.removeEventListener("error", onError);
              audio.removeEventListener("pause", onPause);
            }
            function done(err?: Error) {
              if (settled) return;
              settled = true;
              cleanup();
              URL.revokeObjectURL(url);
              if (err) reject(err);
              else resolve();
            }
            function onEnded() { done(); }
            function onError() { done(new Error("Audio gagal diputar")); }
            function onPause() { if (seq !== speakSeq.current) done(); }
            audio.addEventListener("ended", onEnded);
            audio.addEventListener("error", onError);
            audio.addEventListener("pause", onPause);
            audio.src = url;
            audio.play().catch((e) => done(e instanceof Error ? e : new Error("Autoplay diblokir")));
          });
        }
      };

      if (ttsRef.current.neural && onlineRef.current) {
        speakNeural().catch(() => {
          if (seq !== speakSeq.current) return;
          speakSystem();
        });
      } else {
        speakSystem();
      }
    },
    [fetchChunk, halt]
  );

  const stopSpeak = halt;

  const voiceSigRef = useRef<string | null>(null);
  const voiceSig = `${neural}:${activeNeuralVoice}:${voiceURI}`;

  useEffect(() => {
    if (voiceSigRef.current === null) {
      voiceSigRef.current = voiceSig;
      return;
    }
    if (voiceSigRef.current === voiceSig) return;
    voiceSigRef.current = voiceSig;
    if (!ttsRef.current.enabled) return;
    const last = lastNarrationRef.current;
    if (!last) return;
    speak(last);
  }, [voiceSig, speak]);

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

      const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";
      getValidToken().then((token) => {
        if (!token) return;
        fetch(`${apiUrl}/student/quiz/submit`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            quizId: quiz.id,
            score: total,
            correctCount: cc,
            totalQuestions: quiz.questions.length,
          }),
        }).catch((err) => console.error("Gagal menyimpan nilai kuis:", err));
      });
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

  const looksUnderstood = useCallback(
    (t: string) => {
      const low = t.toLowerCase();
      if (
        has(
          low,
          "mulai", "start", "berikut", "lanjut", "next", "sebelum", "kembali", "mundur",
          "jawab", "kunci", "kirim", "ulangi", "ulang", "bacakan", "bantuan", "help",
          "skor", "poin", "nilai", "streak", "waktu", "sisa", "timer", "selesai",
          "berhenti", "keluar", "stop", "lewati", "skip", "ya", "tidak", "batal",
          "opsi", "nomor", "pilihan", "jawaban"
        )
      ) {
        return true;
      }
      const s = stateRef.current;
      const item = quiz?.questions[s.qIndex];
      if (item && matchOptionIndex(low, item.options) != null) return true;
      return false;
    },
    [quiz]
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
    if (listenSeq.current !== 0) return;
    try {
      stopSpeak();
      recogRef.current?.abort();
      const rec = new Ctor();
      rec.lang = "id-ID";
      rec.continuous = true;
      rec.interimResults = true;
      rec.maxAlternatives = 5;
      recogRef.current = rec;
      const seq = ++listenSeq.current;
      let handled = false;
      let best = "";
      let debounce: number | null = null;

      const clearDebounce = () => {
        if (debounce != null) { window.clearTimeout(debounce); debounce = null; }
      };
      const clearSafety = () => {
        if (listenTimer.current != null) { window.clearTimeout(listenTimer.current); listenTimer.current = null; }
      };
      const finish = (heard: string) => {
        if (handled) return;
        handled = true;
        clearDebounce();
        clearSafety();
        setListening(false);
        setTranscript(heard);
        listenSeq.current = 0;
        recogRef.current = null;
        try { rec.stop(); } catch {}
        if (heard) handleCommand(heard);
        else unknown("");
      };

      setListening(true);
      setMicError(null);
      setTranscript("");

      rec.onresult = (e) => {
        if (seq !== listenSeq.current || handled) return;
        let interim = "";
        const finals: string[] = [];
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const res = e.results[i];
          if (!res) continue;
          if (res.isFinal) {
            const alts: string[] = [];
            for (let j = 0; j < res.length; j++) {
              const a = res[j]?.transcript?.trim();
              if (a) alts.push(a);
            }
            const chosen = alts.find((a) => looksUnderstood(a)) ?? alts[0];
            if (chosen) finals.push(chosen);
          } else {
            const it = res[0]?.transcript?.trim();
            if (it) interim += `${it} `;
          }
        }
        if (finals.length) {
          best = finals.join(" ").trim();
          finish(best);
          return;
        }
        const current = interim.trim();
        if (current) { best = current; setTranscript(current); }
        clearDebounce();
        debounce = window.setTimeout(() => finish(best), 900);
      };

      rec.onerror = (e) => {
        if (seq !== listenSeq.current || handled) return;
        if (e.error === "not-allowed" || e.error === "service-not-allowed") {
          handled = true;
          clearDebounce();
          clearSafety();
          setListening(false);
          listenSeq.current = 0;
          recogRef.current = null;
          setMicError("Izin mikrofon ditolak. Aktifkan izin mic di pengaturan browser, atau lanjutkan dengan ketuk jawaban manual.");
          speak("Izin mikrofon ditolak. Aktifkan izin mic di pengaturan browser, atau ketuk jawaban manual.");
          return;
        }
        if (e.error === "network") {
          handled = true;
          clearDebounce();
          clearSafety();
          setListening(false);
          listenSeq.current = 0;
          recogRef.current = null;
          setMicError("Jaringan bermasalah, suara butuh internet. Coba lagi atau pakai tombol manual.");
          speak("Jaringan bermasalah. Coba lagi atau pakai tombol manual.");
          return;
        }
        finish(best);
      };

      rec.onend = () => {
        if (seq !== listenSeq.current || handled) return;
        finish(best);
      };

      listenTimer.current = window.setTimeout(() => {
        if (seq === listenSeq.current) finish(best);
      }, 8000);

      rec.start();
    } catch {
      listenSeq.current = 0;
      setListening(false);
      unknown("");
    }
  }, [handleCommand, looksUnderstood, online, speak, stopSpeak, unknown]);

  useEffect(() => () => {
    listenSeq.current = 0;
    if (listenTimer.current != null) window.clearTimeout(listenTimer.current);
    recogRef.current?.abort();
    if (audioRef.current) {
      try { audioRef.current.pause(); } catch {}
      audioRef.current = null;
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
  }, []);

  return {
    phase, countdown, qIndex, q, selected, locked, correct, answers, pointsEarned,
    streak, totalPoints, correctCount, timeLeft, timerEnabled, timedOut,
    best, isNewBest, failCount,
    listening, transcript, liveMessage, ttsEnabled, rate, pendingDestructive,
    micError, online, support,
    sysVoices, voiceURI, pitch, neural, neuralVoice: activeNeuralVoice, neuralVoices,
    brave: isBrave, micSupported,
    setSelected, setTtsEnabled, setRate, setTimerEnabled,
    setVoiceURI, setPitch, setNeural, setNeuralVoice,
    speak, stopSpeak, listenOnce, handleCommand,
    start, submit, next, advance, prev, skipCountdown, resetToLobby, help, sayScore, sayTime, readQuestion,
  };
}
