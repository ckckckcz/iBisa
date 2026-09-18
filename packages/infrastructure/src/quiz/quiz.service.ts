import { getSupabaseAdmin } from "../supabase/client.js";
import { getTeacherAllowedClassIds } from "../classes/classes.service.js";

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
  created_by_name: string | null;
  original_by: string | null;
  original_by_name: string | null;
  code: string;
  title: string;
  subject: string;
  time_limit: number;
  base_points: number;
  questions: QuizQuestionInput[];
  class_ids: string[];
  created_at: string;
};

const QUIZ_SELECT =
  "id, school_id, created_by, code, title, subject, time_limit, base_points, questions, created_at, " +
  "created_author:users!quizzes_created_by_fkey(full_name), " +
  "original_author:users!quizzes_original_by_fkey(full_name), " +
  "class_assignments:quiz_classes(class_id)";

type QuizRow = {
  id: string;
  school_id: string | null;
  created_by: string | null;
  original_by: string | null;
  code: string;
  title: string;
  subject: string;
  time_limit: number;
  base_points: number;
  questions: QuizQuestionInput[];
  created_at: string;
  created_author: { full_name: string | null } | null;
  original_author: { full_name: string | null } | null;
  class_assignments: { class_id: string }[] | null;
};

function toQuizRecord(row: QuizRow): QuizRecord {
  return {
    ...row,
    created_by_name: row.created_author?.full_name ?? null,
    original_by: row.original_by ?? null,
    original_by_name: row.original_author?.full_name ?? null,
    class_ids: (row.class_assignments ?? []).map((a) => a.class_id),
  };
}

type QuizActor = { userId: string; role: string };

export type QuizCreateInput = {
  title: string;
  subject?: string;
  time_limit?: number;
  base_points?: number;
  questions: QuizQuestionInput[];
  class_ids?: string[];
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

async function assertClassIds(
  schoolId: string,
  classIds: string[],
  allowedClassIds?: string[],
  { allowEmpty = false }: { allowEmpty?: boolean } = {}
): Promise<string[]> {
  const unique = [...new Set(classIds.map((c) => String(c).trim()).filter(Boolean))];
  if (unique.length === 0 && !allowEmpty) throw new Error("Pilih minimal 1 kelas.");
  if (unique.length === 0) return [];
  const admin = getSupabaseAdmin();
  if (!admin) throw new Error("Supabase not configured");
  const { data, error } = await admin.from("classes").select("id").eq("school_id", schoolId).in("id", unique);
  if (error) throw new Error(error.message);
  if (!data || data.length !== unique.length) throw new Error("Ada kelas yang tidak valid.");
  if (allowedClassIds) {
    const allowed = new Set(allowedClassIds);
    const forbidden = unique.filter((id) => !allowed.has(id));
    if (forbidden.length > 0) throw new Error("Kamu tidak terdaftar mengajar kelas tersebut.");
  }
  return unique;
}

async function replaceQuizClasses(quizId: string, classIds: string[]) {
  const admin = getSupabaseAdmin();
  if (!admin) throw new Error("Supabase not configured");
  const { error: delErr } = await admin.from("quiz_classes").delete().eq("quiz_id", quizId);
  if (delErr) throw new Error(delErr.message);
  if (classIds.length === 0) return;
  const rows = classIds.map((class_id) => ({ quiz_id: quizId, class_id }));
  const { error } = await admin.from("quiz_classes").insert(rows);
  if (error) throw new Error(error.message);
}

export async function createQuiz(
  schoolId: string,
  createdBy: string | null,
  body: QuizCreateInput,
  allowedClassIds?: string[]
): Promise<QuizRecord> {
  const admin = getSupabaseAdmin();
  if (!admin) throw new Error("Supabase not configured");
  if (!body?.title?.trim()) throw new Error("Judul wajib.");
  assertValidQuestions(body.questions);
  const classIds = await assertClassIds(schoolId, body.class_ids ?? [], allowedClassIds);
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
      original_by: createdBy,
      code,
      title: body.title.trim(),
      subject: body.subject?.trim() || "",
      time_limit: body.time_limit || 60,
      base_points: body.base_points || 1000,
      questions: body.questions,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  await replaceQuizClasses((data as { id: string }).id, classIds);
  const record = await getQuizByCode(code);
  if (!record) throw new Error("Kuis gagal dibuat.");
  return record;
}

export async function listQuizzes(schoolId: string): Promise<QuizRecord[]> {
  const admin = getSupabaseAdmin();
  if (!admin) throw new Error("Supabase not configured");
  const { data, error } = await admin
    .from("quizzes")
    .select(QUIZ_SELECT)
    .eq("school_id", schoolId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return ((data ?? []) as unknown as QuizRow[]).map(toQuizRecord);
}

export async function listStudentQuizzes(schoolId: string, classId: string): Promise<QuizRecord[]> {
  const admin = getSupabaseAdmin();
  if (!admin) throw new Error("Supabase not configured");
  const { data: links, error: linkErr } = await admin.from("quiz_classes").select("quiz_id").eq("class_id", classId);
  if (linkErr) throw new Error(linkErr.message);
  const quizIds = (links ?? []).map((l) => l.quiz_id);
  if (quizIds.length === 0) return [];
  const { data, error } = await admin
    .from("quizzes")
    .select(QUIZ_SELECT)
    .eq("school_id", schoolId)
    .in("id", quizIds)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return ((data ?? []) as unknown as QuizRow[]).map(toQuizRecord);
}

export async function getStudentClassId(studentId: string): Promise<string | null> {
  const admin = getSupabaseAdmin();
  if (!admin) throw new Error("Supabase not configured");
  const { data, error } = await admin.from("users").select("class_id").eq("id", studentId).maybeSingle();
  if (error) throw new Error(error.message);
  return data?.class_id ?? null;
}

export async function getQuizByCode(code: string): Promise<QuizRecord | null> {
  const admin = getSupabaseAdmin();
  if (!admin) throw new Error("Supabase not configured");
  const { data, error } = await admin.from("quizzes").select(QUIZ_SELECT).eq("code", code.trim()).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? toQuizRecord(data as unknown as QuizRow) : null;
}

export async function copyQuiz(schoolId: string, actor: QuizActor, sourceCode: string): Promise<QuizRecord> {
  const admin = getSupabaseAdmin();
  if (!admin) throw new Error("Supabase not configured");
  const source = await getQuizByCode(sourceCode);
  if (!source || source.school_id !== schoolId) throw new Error("Kuis tidak ditemukan.");
  if (source.created_by === actor.userId) throw new Error("Kuis ini sudah milikmu.");
  let classIds = source.class_ids ?? [];
  if (actor.role === "teacher") {
    const allowed = new Set(await getTeacherAllowedClassIds(actor.userId));
    classIds = classIds.filter((id) => allowed.has(id));
    if (classIds.length === 0) {
      throw new Error("Kuis sumber tidak untuk kelas yang kamu ajar.");
    }
  } else if (classIds.length === 0) {
    throw new Error("Kuis sumber belum ditetapkan ke kelas.");
  }
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
      created_by: actor.userId,
      original_by: source.original_by ?? source.created_by ?? actor.userId,
      code,
      title: source.title,
      subject: source.subject,
      time_limit: source.time_limit,
      base_points: source.base_points,
      questions: source.questions,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  await replaceQuizClasses((data as { id: string }).id, classIds);
  const record = await getQuizByCode(code);
  if (!record) throw new Error("Salinan kuis gagal dibuat.");
  return record;
}

export type QuizUpdateInput = Partial<Pick<QuizCreateInput, "title" | "subject" | "time_limit" | "base_points" | "questions" | "class_ids">>;

export async function updateQuiz(schoolId: string, code: string, actor: QuizActor, patch: QuizUpdateInput): Promise<QuizRecord> {
  const admin = getSupabaseAdmin();
  if (!admin) throw new Error("Supabase not configured");
  const existing = await getQuizByCode(code);
  if (!existing || existing.school_id !== schoolId) throw new Error("Kuis tidak ditemukan.");
  if (actor.role !== "school" && existing.created_by !== actor.userId) {
    throw new Error("Hanya pemilik kuis atau admin sekolah yang bisa mengedit.");
  }
  const update: { title?: string; subject?: string; time_limit?: number; base_points?: number; questions?: QuizQuestionInput[] } = {};
  if (patch.title !== undefined) {
    if (!String(patch.title).trim()) throw new Error("Judul wajib.");
    update.title = String(patch.title).trim();
  }
  if (patch.subject !== undefined) update.subject = String(patch.subject).trim();
  if (patch.time_limit !== undefined) {
    const tl = Number(patch.time_limit) || 60;
    if (tl < 10 || tl > 3600) throw new Error("Batas waktu harus 10-3600 detik.");
    update.time_limit = tl;
  }
  if (patch.base_points !== undefined) update.base_points = Number(patch.base_points) || 1000;
  if (patch.questions !== undefined) {
    assertValidQuestions(patch.questions);
    update.questions = patch.questions;
  }
  if (Object.keys(update).length === 0 && patch.class_ids === undefined) throw new Error("Tidak ada data yang diubah.");
  if (Object.keys(update).length > 0) {
    const { error } = await admin
      .from("quizzes")
      .update(update)
      .eq("id", existing.id)
      .eq("school_id", schoolId);
    if (error) throw new Error(error.message);
  }
  if (patch.class_ids !== undefined) {
    const allowedIds = actor.role === "teacher" ? await getTeacherAllowedClassIds(actor.userId) : undefined;
    const classIds = await assertClassIds(schoolId, patch.class_ids, allowedIds, { allowEmpty: true });
    await replaceQuizClasses(existing.id, classIds);
  }
  const record = await getQuizByCode(code);
  if (!record) throw new Error("Kuis tidak ditemukan.");
  return record;
}

export async function deleteQuiz(schoolId: string, code: string, actor: QuizActor): Promise<void> {
  const admin = getSupabaseAdmin();
  if (!admin) throw new Error("Supabase not configured");
  const existing = await getQuizByCode(code);
  if (!existing || existing.school_id !== schoolId) throw new Error("Kuis tidak ditemukan.");
  if (actor.role !== "school" && existing.created_by !== actor.userId) {
    throw new Error("Hanya pemilik kuis atau admin sekolah yang bisa menghapus.");
  }
  const { error } = await admin.from("quizzes").delete().eq("id", existing.id).eq("school_id", schoolId);
  if (error) throw new Error(error.message);
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
  attemptedStudents: number;
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

export async function getTeacherQuizStats(schoolId: string, activeStudents: number, studentIds?: string[]): Promise<TeacherDashboardStats> {
  const quizzes = await listQuizzes(schoolId);
  const allResults = await listQuizResults(schoolId);
  const scoped = studentIds && studentIds.length > 0
    ? allResults.filter((r) => studentIds.includes(r.student_id))
    : allResults;

  const byQuiz = new Map<string, { attempts: number; nilaiSum: number; nilaiMax: number }>();
  const studentsByQuiz = new Map<string, Set<string>>();
  for (const r of scoped) {
    const cur = byQuiz.get(r.quiz_id) ?? { attempts: 0, nilaiSum: 0, nilaiMax: 0 };
    cur.attempts += 1;
    cur.nilaiSum += r.nilai;
    cur.nilaiMax = Math.max(cur.nilaiMax, r.nilai);
    byQuiz.set(r.quiz_id, cur);
    const students = studentsByQuiz.get(r.quiz_id) ?? new Set<string>();
    students.add(r.student_id);
    studentsByQuiz.set(r.quiz_id, students);
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
      attemptedStudents: studentsByQuiz.get(q.id)?.size ?? 0,
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
  for (const r of scoped) {
    const key = new Date(r.created_at).toISOString().slice(0, 10);
    const day = chart.find((c) => c.date === key);
    if (day) day.submissions += 1;
  }

  const latestByStudent = new Map<string, number>();
  for (const r of scoped) {
    if (!latestByStudent.has(r.student_id)) latestByStudent.set(r.student_id, r.nilai);
  }
  const needsHelpCount = [...latestByStudent.values()].filter((n) => n < 60).length;
  const engagementPct = activeStudents > 0 ? Math.round((latestByStudent.size / activeStudents) * 100) : 0;

  return {
    activeStudents,
    totalQuizzes: quizzes.length,
    totalAttempts: scoped.length,
    engagementPct,
    needsHelpCount,
    quizzes: quizStats,
    chart,
  };
}
