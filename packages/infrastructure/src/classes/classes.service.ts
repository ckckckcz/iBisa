import { getSupabaseAdmin } from "../supabase/client.js";

export async function listClasses(schoolId: string) {
  const admin = getSupabaseAdmin();
  if (!admin) throw new Error("Supabase not configured");
  const { data, error } = await admin.from("classes").select("id,name,tingkat,wali_guru_id,created_at").eq("school_id", schoolId).order("created_at");
  if (error) throw new Error(error.message);
  return data;
}

export async function createClass(schoolId: string, p: { name: string; tingkat: string; wali_guru_id?: string | null }) {
  const admin = getSupabaseAdmin();
  if (!admin) throw new Error("Supabase not configured");
  if (p.wali_guru_id) {
    const { data: guru } = await admin.from("users_with_role").select("id").eq("id", p.wali_guru_id).eq("school_id", schoolId).eq("role", "teacher").single();
    if (!guru) throw new Error("Wali guru tidak valid");
  }
  const { data, error } = await admin.from("classes").insert({ school_id: schoolId, name: p.name, tingkat: p.tingkat, wali_guru_id: p.wali_guru_id ?? null }).select("id,name,tingkat,wali_guru_id").single();
  if (error) throw new Error(error.message);
  return data;
}

export async function updateClass(schoolId: string, id: string, patch: { name?: string; tingkat?: string; wali_guru_id?: string | null }) {
  const admin = getSupabaseAdmin();
  if (!admin) throw new Error("Supabase not configured");
  if (patch.wali_guru_id) {
    const { data: guru } = await admin.from("users_with_role").select("id").eq("id", patch.wali_guru_id).eq("school_id", schoolId).eq("role", "teacher").single();
    if (!guru) throw new Error("Wali guru tidak valid");
  }
  const { data, error } = await admin.from("classes").update(patch).eq("id", id).eq("school_id", schoolId).select("id,name,tingkat,wali_guru_id").single();
  if (error) throw new Error(error.message);
  return data;
}

export async function deleteClass(schoolId: string, id: string) {
  const admin = getSupabaseAdmin();
  if (!admin) throw new Error("Supabase not configured");
  const { error } = await admin.from("classes").delete().eq("id", id).eq("school_id", schoolId);
  if (error) throw new Error(error.message);
}

export type TeacherClassAssignment = { teacher_id: string; class_id: string };

export async function getTeacherClassAssignments(schoolId: string): Promise<TeacherClassAssignment[]> {
  const admin = getSupabaseAdmin();
  if (!admin) throw new Error("Supabase not configured");
  const { data: classes } = await admin
    .from("classes")
    .select("id")
    .eq("school_id", schoolId);
  const classIds = (classes ?? []).map((c) => c.id);
  if (classIds.length === 0) return [];
  const { data, error } = await admin
    .from("teacher_classes")
    .select("teacher_id,class_id")
    .in("class_id", classIds);
  if (error) throw new Error(error.message);
  return (data ?? []) as TeacherClassAssignment[];
}

export async function updateTeacherAssignments(
  schoolId: string,
  teacherId: string,
  patch: { taughtClassIds: string[]; waliClassId: string | null }
) {
  const admin = getSupabaseAdmin();
  if (!admin) throw new Error("Supabase not configured");

  const { data: teacher } = await admin
    .from("users_with_role")
    .select("id")
    .eq("id", teacherId)
    .eq("school_id", schoolId)
    .eq("role", "teacher")
    .single();
  if (!teacher) throw new Error("Guru tidak valid");

  const ids = new Set<string>(patch.taughtClassIds);
  if (patch.waliClassId) ids.add(patch.waliClassId);
  if (ids.size > 0) {
    const { data: classes, error: clsErr } = await admin
      .from("classes")
      .select("id")
      .eq("school_id", schoolId)
      .in("id", [...ids]);
    if (clsErr) throw new Error(clsErr.message);
    if ((classes ?? []).length !== ids.size) throw new Error("Ada kelas yang tidak valid");
  }

  const { error: delErr } = await admin
    .from("teacher_classes")
    .delete()
    .eq("teacher_id", teacherId);
  if (delErr) throw new Error(delErr.message);

  if (patch.taughtClassIds.length > 0) {
    const rows = patch.taughtClassIds.map((class_id) => ({ teacher_id: teacherId, class_id }));
    const { error: insErr } = await admin.from("teacher_classes").insert(rows);
    if (insErr) throw new Error(insErr.message);
  }

  const { error: waliErr } = await admin
    .from("classes")
    .update({ wali_guru_id: null })
    .eq("school_id", schoolId)
    .eq("wali_guru_id", teacherId);
  if (waliErr) throw new Error(waliErr.message);

  if (patch.waliClassId) {
    const { error: waliSetErr } = await admin
      .from("classes")
      .update({ wali_guru_id: teacherId })
      .eq("id", patch.waliClassId)
      .eq("school_id", schoolId);
    if (waliSetErr) throw new Error(waliSetErr.message);
  }

  return { schoolId, teacherId, taughtClassIds: patch.taughtClassIds, waliClassId: patch.waliClassId };
}
