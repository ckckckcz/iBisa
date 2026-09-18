import { QUIZZES, getQuizByCode, type Quiz, type QuizQuestion } from "@/types/questions";
import { getValidToken } from "@/lib/ai-helpers";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

export type DbQuiz = {
  id: string;
  code: string;
  title: string;
  subject: string;
  time_limit: number;
  base_points: number;
  questions: { question: string; options: [string, string, string, string]; answerIndex: number; explanation: string }[];
  created_by?: string | null;
  created_by_name?: string | null;
  original_by?: string | null;
  original_by_name?: string | null;
  created_at?: string;
};

export type QuizCompletionStatus = "Not Attempted" | "In Process" | "Completed";

export function quizStatus(
  attemptedStudents: number,
  totalStudents: number
): QuizCompletionStatus {
  if (attemptedStudents <= 0) return "Not Attempted";
  if (totalStudents > 0 && attemptedStudents >= totalStudents) return "Completed";
  return "In Process";
}

const COVERS: Record<string, { cover: string; accent: string }> = {
  IPA: { cover: "from-blue-700 to-blue-900", accent: "bg-blue-700" },
  Matematika: { cover: "from-emerald-600 to-teal-800", accent: "bg-emerald-600" },
  "Bahasa Indonesia": { cover: "from-amber-500 to-orange-700", accent: "bg-amber-600" },
};
const FALLBACK_COVER = { cover: "from-slate-600 to-slate-800", accent: "bg-slate-600" };

const SOFT_THEMES: Record<string, { softBg: string; softRing: string; solidBg: string; softText: string; codeBg: string }> = {
  IPA: { softBg: "bg-blue-50", softRing: "ring-blue-200", solidBg: "bg-blue-600", softText: "text-blue-800", codeBg: "bg-blue-600" },
  Matematika: { softBg: "bg-emerald-50", softRing: "ring-emerald-200", solidBg: "bg-emerald-600", softText: "text-emerald-800", codeBg: "bg-emerald-600" },
  "Bahasa Indonesia": { softBg: "bg-amber-50", softRing: "ring-amber-200", solidBg: "bg-amber-600", softText: "text-amber-800", codeBg: "bg-amber-600" },
};
const FALLBACK_SOFT = { softBg: "bg-slate-50", softRing: "ring-slate-200", solidBg: "bg-slate-700", softText: "text-slate-700", codeBg: "bg-slate-700" };

export function getQuizTheme(subject?: string | null) {
  const cover = COVERS[subject ?? ""] ?? FALLBACK_COVER;
  const soft = SOFT_THEMES[subject ?? ""] ?? FALLBACK_SOFT;
  return { ...cover, ...soft };
}

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
    headers: { Authorization: `Bearer ${await getValidToken()}` },
  });
  const data = await res.json();
  return res.ok && data.success ? data.data : null;
}

async function postDb(path: string, body: unknown) {
  const res = await fetch(`${apiUrl}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${await getValidToken()}` },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message ?? "Permintaan gagal.");
  }
  return data.data as DbQuiz;
}

export async function copyQuizByCode(code: string): Promise<DbQuiz> {
  return postDb("/quizzes/copy", { code });
}

export async function updateQuizByCode(
  code: string,
  patch: { title?: string; subject?: string; time_limit?: number; base_points?: number; questions?: DbQuiz["questions"] }
): Promise<DbQuiz> {
  const res = await fetch(`${apiUrl}/quizzes/${encodeURIComponent(code)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${await getValidToken()}` },
    body: JSON.stringify(patch),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message ?? "Gagal menyimpan perubahan.");
  }
  return data.data as DbQuiz;
}

export async function deleteQuizByCode(code: string): Promise<void> {
  const res = await fetch(`${apiUrl}/quizzes/${encodeURIComponent(code)}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${await getValidToken()}` },
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message ?? "Gagal menghapus kuis.");
  }
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

export async function fetchTeacherQuizzes(): Promise<DbQuiz[]> {
  try {
    const data = await fetchDb("/quizzes");
    return Array.isArray(data) ? (data as DbQuiz[]) : [];
  } catch {
    return [];
  }
}
