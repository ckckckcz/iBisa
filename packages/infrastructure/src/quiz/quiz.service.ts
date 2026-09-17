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

export async function submitQuizScore(
  studentId: string,
  quizId: string,
  score: number,
  correctCount: number,
  totalQuestions: number
) {
  if (!Number.isFinite(score) || !Number.isFinite(correctCount) || !Number.isFinite(totalQuestions)) {
    throw new Error("Data nilai kuis tidak valid.");
  }
  const admin = getSupabaseAdmin();
  if (!admin) throw new Error("Supabase not configured");

  const { data, error } = await admin.from("quiz_results").insert({
    student_id: studentId,
    quiz_id: quizId,
    score: score,
    correct_count: correctCount,
    total_questions: totalQuestions,
  }).select().single();

  if (error) throw new Error(error.message);
  return data;
}

export type QuizResultRecord = {
  id: string;
  student_id: string;
  student_name: string | null;
  quiz_id: string;
  quiz_title: string | null;
  subject: string | null;
  score: number;
  correct_count: number;
  total_questions: number;
  nilai: number;
  created_at: string;
};

export async function listQuizResults(schoolId: string): Promise<QuizResultRecord[]> {
  const admin = getSupabaseAdmin();
  if (!admin) throw new Error("Supabase not configured");

  const { data, error } = await admin
    .from("quiz_results")
    .select(
      "id, score, correct_count, total_questions, created_at, quiz_id, student_id, " +
        "quizzes!inner(id, title, subject, school_id), " +
        "users(full_name)"
    )
    .eq("quizzes.school_id", schoolId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  const rows = (data ?? []) as unknown as Array<{
    id: string;
    student_id: string;
    quiz_id: string;
    score: number;
    correct_count: number;
    total_questions: number;
    created_at: string;
    quizzes: { id: string; title: string | null; subject: string | null; school_id: string };
    users: { full_name: string | null } | null;
  }>;

  return rows.map((row) => ({
    id: row.id,
    student_id: row.student_id,
    student_name: row.users?.full_name ?? null,
    quiz_id: row.quiz_id,
    quiz_title: row.quizzes?.title ?? null,
    subject: row.quizzes?.subject ?? null,
    score: row.score,
    correct_count: row.correct_count,
    total_questions: row.total_questions,
    nilai: row.total_questions > 0 ? Math.round((row.correct_count / row.total_questions) * 100) : 0,
    created_at: row.created_at,
  }));
}

export type StudentQuizResult = {
  quiz_id: string;
  quiz_title: string | null;
  subject: string | null;
  score: number;
  correct_count: number;
  total_questions: number;
  nilai: number;
  created_at: string;
};

export async function listStudentQuizResults(studentId: string): Promise<StudentQuizResult[]> {
  const admin = getSupabaseAdmin();
  if (!admin) throw new Error("Supabase not configured");

  const { data, error } = await admin
    .from("quiz_results")
    .select(
      "id, quiz_id, student_id, score, correct_count, total_questions, created_at, " +
        "quizzes(title, subject)"
    )
    .eq("student_id", studentId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  const rows = (data ?? []) as unknown as Array<{
    quiz_id: string;
    score: number;
    correct_count: number;
    total_questions: number;
    created_at: string;
    quizzes: { title: string | null; subject: string | null } | null;
  }>;

  return rows.map((row) => ({
    quiz_id: row.quiz_id,
    quiz_title: row.quizzes?.title ?? null,
    subject: row.quizzes?.subject ?? null,
    score: row.score,
    correct_count: row.correct_count,
    total_questions: row.total_questions,
    nilai: row.total_questions > 0 ? Math.round((row.correct_count / row.total_questions) * 100) : 0,
    created_at: row.created_at,
  }));
}

export type TeacherQuizStat = {
  id: string;
  code: string;
  title: string;
  subject: string;
  questionCount: number;
  attempts: number;
  avgNilai: number;
  bestNilai: number;
};

export type TeacherDashboardStats = {
  activeStudents: number;
  totalQuizzes: number;
  totalAttempts: number;
  engagementPct: number;
  needsHelpCount: number;
  quizzes: TeacherQuizStat[];
  chart: { date: string; submissions: number }[];
};

export async function getTeacherQuizStats(schoolId: string, activeStudents: number): Promise<TeacherDashboardStats> {
  const quizzes = await listQuizzes(schoolId);
  const results = await listQuizResults(schoolId);

  const byQuiz = new Map<string, { attempts: number; nilaiSum: number; nilaiMax: number }>();
  for (const r of results) {
    const cur = byQuiz.get(r.quiz_id) ?? { attempts: 0, nilaiSum: 0, nilaiMax: 0 };
    cur.attempts += 1;
    cur.nilaiSum += r.nilai;
    cur.nilaiMax = Math.max(cur.nilaiMax, r.nilai);
    byQuiz.set(r.quiz_id, cur);
  }

  const quizStats: TeacherQuizStat[] = quizzes.map((q) => {
    const s = byQuiz.get(q.id) ?? { attempts: 0, nilaiSum: 0, nilaiMax: 0 };
    return {
      id: q.id,
      code: q.code,
      title: q.title,
      subject: q.subject,
      questionCount: Array.isArray(q.questions) ? q.questions.length : 0,
      attempts: s.attempts,
      avgNilai: s.attempts > 0 ? Math.round(s.nilaiSum / s.attempts) : 0,
      bestNilai: s.nilaiMax,
    };
  });

  const chart: { date: string; submissions: number }[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 89; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    chart.push({ date: d.toISOString().slice(0, 10), submissions: 0 });
  }
  for (const r of results) {
    const key = new Date(r.created_at).toISOString().slice(0, 10);
    const day = chart.find((c) => c.date === key);
    if (day) day.submissions += 1;
  }

  const latestByStudent = new Map<string, number>();
  for (const r of results) {
    if (!latestByStudent.has(r.student_id)) latestByStudent.set(r.student_id, r.nilai);
  }
  const needsHelpCount = [...latestByStudent.values()].filter((n) => n < 60).length;
  const engagementPct = activeStudents > 0 ? Math.round((latestByStudent.size / activeStudents) * 100) : 0;

  return {
    activeStudents,
    totalQuizzes: quizzes.length,
    totalAttempts: results.length,
    engagementPct,
    needsHelpCount,
    quizzes: quizStats,
    chart,
  };
}
