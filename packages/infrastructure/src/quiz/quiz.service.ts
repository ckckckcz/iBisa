import { getSupabaseAdmin } from "../supabase/client.js";

export type QuizQuestionInput = {
  question: string;
  options: [string, string, string, string];
  answerIndex: number;
  explanation: string;
};

export type QuizRecord = {
  id: string;
  school_id: string | null;
  created_by: string | null;
  code: string;
  title: string;
  subject: string;
  time_limit: number;
  base_points: number;
  questions: QuizQuestionInput[];
  created_at: string;
};

export type QuizCreateInput = {
  title: string;
  subject?: string;
  time_limit?: number;
  base_points?: number;
  questions: QuizQuestionInput[];
};

function assertValidQuestions(questions: unknown): asserts questions is QuizQuestionInput[] {
  if (!Array.isArray(questions) || questions.length < 1 || questions.length > 20) {
    throw new Error("Soal harus 1-20 butir.");
  }
  for (const q of questions) {
    if (typeof q?.question !== "string" || !q.question.trim()) throw new Error("Ada soal tanpa teks.");
    if (!Array.isArray(q?.options) || q.options.length !== 4 || q.options.some((o: unknown) => typeof o !== "string" || !o.trim())) {
      throw new Error("Setiap soal harus punya tepat 4 opsi.");
    }
    if (!Number.isInteger(q?.answerIndex) || q.answerIndex < 0 || q.answerIndex > 3) {
      throw new Error("Kunci jawaban harus 0-3.");
    }
  }
}

function randomCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function createQuiz(schoolId: string, createdBy: string | null, body: QuizCreateInput): Promise<QuizRecord> {
  const admin = getSupabaseAdmin();
  if (!admin) throw new Error("Supabase not configured");
  if (!body?.title?.trim()) throw new Error("Judul wajib.");
  assertValidQuestions(body.questions);
  let code = randomCode();
  for (let i = 0; i < 10; i++) {
    const { data } = await admin.from("quizzes").select("id").eq("code", code).maybeSingle();
    if (!data) break;
    code = randomCode();
  }
  const { data, error } = await admin
    .from("quizzes")
    .insert({
      school_id: schoolId,
      created_by: createdBy,
      code,
      title: body.title.trim(),
      subject: body.subject?.trim() || "",
      time_limit: body.time_limit || 60,
      base_points: body.base_points || 1000,
      questions: body.questions,
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data as QuizRecord;
}

export async function listQuizzes(schoolId: string): Promise<QuizRecord[]> {
  const admin = getSupabaseAdmin();
  if (!admin) throw new Error("Supabase not configured");
  const { data, error } = await admin
    .from("quizzes")
    .select("*")
    .eq("school_id", schoolId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as QuizRecord[];
}

export async function getQuizByCode(code: string): Promise<QuizRecord | null> {
  const admin = getSupabaseAdmin();
  if (!admin) throw new Error("Supabase not configured");
  const { data, error } = await admin.from("quizzes").select("*").eq("code", code.trim()).maybeSingle();
  if (error) throw new Error(error.message);
  return (data as QuizRecord | null) ?? null;
}
