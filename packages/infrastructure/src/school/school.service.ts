import { getSupabaseAdmin } from "../supabase/client.js";
import { createUserWithProfile } from "../auth/auth.service.js";

export type MemberPatch = {
  full_name?: string; whatsapp?: string | null; number?: string | null;
  gender?: "male" | "female" | null; status?: "active" | "on_leave" | "inactive";
  avatar_url?: string | null; guardian_name?: string | null;
  attendance_pct?: number | null; grade?: string | null;
  subject?: string | null; class_id?: string | null;
  password?: string | null;
};

const MEMBER_SELECT = "id,email,full_name,role,school_id,whatsapp,number,gender,status,avatar_url,guardian_name,attendance_pct,grade,subject,class_id,created_at";

export async function listMembers(schoolId: string, role: string) {
  const admin = getSupabaseAdmin();
  if (!admin) throw new Error("Supabase not configured");
  const { data, error } = await admin.from("users_with_role").select(MEMBER_SELECT).eq("school_id", schoolId).eq("role", role).order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data;
}

async function assertClassOfSchool(classId: string, schoolId: string) {
  const admin = getSupabaseAdmin();
  if (!admin) throw new Error("Supabase not configured");
  const { data, error } = await admin.from("classes").select("id").eq("id", classId).eq("school_id", schoolId).single();
  if (error || !data) throw new Error("Kelas tidak valid");
}

export async function createMember(schoolId: string, role: "teacher" | "student", p: { fullName: string; email: string; password?: string; whatsapp?: string | null } & Omit<MemberPatch, "full_name" | "whatsapp">) {
  if (p.class_id) await assertClassOfSchool(p.class_id, schoolId);
  const rawNum = String(p.number ?? "").trim();
  const numPw = rawNum.length >= 6 ? rawNum : rawNum ? `${rawNum}1234` : "";
  const finalPassword = p.password || numPw || "Bisa1234!";
  return createUserWithProfile({
    email: p.email, password: finalPassword, fullName: p.fullName, role, schoolId,
    whatsapp: p.whatsapp ?? null, number: p.number ?? null, gender: p.gender ?? null,
    status: p.status ?? "active", avatar_url: p.avatar_url ?? null,
    guardian_name: p.guardian_name ?? null, attendance_pct: p.attendance_pct ?? 100,
    grade: p.grade ?? null, subject: p.subject ?? null, class_id: p.class_id ?? null,
  });
}

export async function deleteMember(userId: string) {
  const admin = getSupabaseAdmin();
  if (!admin) throw new Error("Supabase not configured");
  const { error: delProfile } = await admin.from("users").delete().eq("id", userId);
  if (delProfile) throw new Error(delProfile.message);
  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) throw new Error(error.message);
}



export async function updateMember(userId: string, schoolId: string, patch: MemberPatch) {
  const admin = getSupabaseAdmin();
  if (!admin) throw new Error("Supabase not configured");
  if (patch.class_id) await assertClassOfSchool(patch.class_id, schoolId);

  if (patch.password && patch.password.trim()) {
    const { error: pwErr } = await admin.auth.admin.updateUserById(userId, { password: patch.password.trim() });
    if (pwErr) throw new Error(`Gagal mengubah password: ${pwErr.message}`);
  }

  const allowed: (keyof MemberPatch)[] = ["full_name", "whatsapp", "number", "gender", "status", "avatar_url", "guardian_name", "attendance_pct", "grade", "subject", "class_id"];
  const clean: Record<string, unknown> = {};
  for (const k of allowed) if (patch[k] !== undefined) clean[k] = patch[k] === "" ? null : patch[k];
  const { data, error } = await admin.from("users").update(clean).eq("id", userId).eq("school_id", schoolId).select("id,email,full_name,whatsapp,number,gender,status,avatar_url,guardian_name,attendance_pct,grade,subject,class_id").single();
  if (error) throw new Error(error.message);
  return data;
}

export type BatchMemberItem = {
  full_name: string;
  email: string;
  password?: string;
  whatsapp?: string | null;
  number?: string | null;
  gender?: "male" | "female" | null;
  status?: "active" | "on_leave" | "inactive";
  guardian_name?: string | null;
  grade?: string | null;
  subject?: string | null;
  class_id?: string | null;
  attendance_pct?: number | null;
};

export async function createMembersBatch(
  schoolId: string,
  role: "teacher" | "student",
  items: BatchMemberItem[]
) {
  const results: { email: string; success: boolean; error?: string }[] = [];
  for (const item of items) {
    try {
      const rawNum = String(item.number ?? "").trim();
      const numPw = rawNum.length >= 6 ? rawNum : rawNum ? `${rawNum}1234` : "";
      const defaultPassword = item.password || numPw || "Bisa1234!";
      await createMember(schoolId, role, {
        fullName: item.full_name,
        email: item.email,
        password: defaultPassword,
        whatsapp: item.whatsapp,
        number: item.number,
        gender: item.gender,
        status: item.status,
        guardian_name: item.guardian_name,
        grade: item.grade,
        subject: item.subject,
        class_id: item.class_id,
        attendance_pct: item.attendance_pct,
      });
      results.push({ email: item.email, success: true });
    } catch (e) {
      results.push({
        email: item.email,
        success: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  }
  const createdCount = results.filter((r) => r.success).length;
  const failedCount = results.filter((r) => !r.success).length;
  return { createdCount, failedCount, results };
}

export async function getTeacherDashboardData(userId: string, schoolId: string) {
  const admin = getSupabaseAdmin();
  if (!admin) throw new Error("Supabase not configured");
  
  const { data: profile } = await admin
    .from("users_with_role")
    .select(MEMBER_SELECT)
    .eq("id", userId)
    .eq("school_id", schoolId)
    .eq("role", "teacher")
    .single();
    
  if (!profile) throw new Error("Profil guru tidak ditemukan");

  const { data: taughtRows } = await admin
    .from("teacher_classes")
    .select("class_id")
    .eq("teacher_id", userId);
  const taughtClassIds = (taughtRows ?? []).map((r) => r.class_id);

  const { data: waliClasses } = await admin
    .from("classes")
    .select("id,name,tingkat,created_at")
    .eq("school_id", schoolId)
    .eq("wali_guru_id", userId);

  let classesTaught: unknown[] = [];
  if (taughtClassIds.length > 0) {
    const { data: taught } = await admin
      .from("classes")
      .select("id,name,tingkat,created_at")
      .eq("school_id", schoolId)
      .in("id", taughtClassIds);
    classesTaught = taught ?? [];
  }

  const classIds = [...new Set([...taughtClassIds, ...(waliClasses ?? []).map((c) => c.id)])];
  let studentsInClasses: unknown[] = [];
  if (classIds.length > 0) {
    const { data: students } = await admin
      .from("users_with_role")
      .select(MEMBER_SELECT)
      .eq("school_id", schoolId)
      .eq("role", "student")
      .in("class_id", classIds);
    studentsInClasses = students ?? [];
  }

  return {
    profile,
    classesTaught,
    waliClasses: waliClasses ?? [],
    students: studentsInClasses,
  };
}

export async function getStudentDashboardData(userId: string, schoolId: string) {
  const admin = getSupabaseAdmin();
  if (!admin) throw new Error("Supabase not configured");

  const { data: profile } = await admin
    .from("users_with_role")
    .select(MEMBER_SELECT)
    .eq("id", userId)
    .eq("school_id", schoolId)
    .eq("role", "student")
    .single();

  if (!profile) throw new Error("Profil siswa tidak ditemukan");

  let classInfo = null;
  let waliInfo = null;

  if (profile.class_id) {
    const { data: cls } = await admin
      .from("classes")
      .select("id,name,tingkat,wali_guru_id")
      .eq("id", profile.class_id)
      .single();
    classInfo = cls ?? null;

    if (cls?.wali_guru_id) {
      const { data: wali } = await admin
        .from("users_with_role")
        .select("id,full_name,email,whatsapp,avatar_url,subject")
        .eq("id", cls.wali_guru_id)
        .single();
      waliInfo = wali ?? null;
    }
  }

  return {
    profile,
    class: classInfo,
    wali: waliInfo,
  };
}

