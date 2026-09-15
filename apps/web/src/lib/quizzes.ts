import { QUIZZES, getQuizByCode, type Quiz, type QuizQuestion } from "@/types/questions";
import { getToken } from "@/lib/ai-helpers";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

type DbQuiz = {
  id: string;
  code: string;
  title: string;
  subject: string;
  time_limit: number;
  base_points: number;
  questions: { question: string; options: [string, string, string, string]; answerIndex: number; explanation: string }[];
};

const COVERS: Record<string, { cover: string; accent: string }> = {
  IPA: { cover: "from-blue-700 to-blue-900", accent: "bg-blue-700" },
  Matematika: { cover: "from-emerald-600 to-teal-800", accent: "bg-emerald-600" },
  "Bahasa Indonesia": { cover: "from-amber-500 to-orange-700", accent: "bg-amber-600" },
};
const FALLBACK_COVER = { cover: "from-slate-600 to-slate-800", accent: "bg-slate-600" };

export function toPlayerQuiz(r: DbQuiz): Quiz {
  const questions: QuizQuestion[] = r.questions.map((q, i) => ({
    id: `${r.id}-q${i + 1}`,
    question: q.question,
    options: q.options,
    answerIndex: q.answerIndex,
    explanation: q.explanation ?? "",
  }));
  const theme = COVERS[r.subject] ?? FALLBACK_COVER;
  return {
    id: r.id,
    code: r.code,
    title: r.title,
    description: `${questions.length} soal buatan guru.`,
    subject: r.subject || "Umum",
    questionCount: questions.length,
    timeLimit: r.time_limit || 60,
    basePoints: r.base_points || 1000,
    cover: theme.cover,
    accent: theme.accent,
    questions,
  };
}

async function fetchDb(path: string) {
  const res = await fetch(`${apiUrl}${path}`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  const data = await res.json();
  return res.ok && data.success ? data.data : null;
}

export async function fetchQuizByCode(code: string): Promise<Quiz | null> {
  const norm = code.trim();
  if (!norm) return null;
  try {
    const record = await fetchDb(`/quizzes/by-code/${encodeURIComponent(norm)}`);
    if (record) return toPlayerQuiz(record as DbQuiz);
  } catch {
    /* offline → fallback lokal */
  }
  return getQuizByCode(norm);
}

export async function fetchLobbyQuizzes(): Promise<Quiz[]> {
  let remote: Quiz[] = [];
  try {
    const records = await fetchDb("/quizzes");
    if (Array.isArray(records)) remote = records.map((r) => toPlayerQuiz(r as DbQuiz));
  } catch {
    /* offline → hanya lokal */
  }
  const seen = new Set(remote.map((q) => q.code));
  return [...remote, ...QUIZZES.filter((q) => !seen.has(q.code))];
}
