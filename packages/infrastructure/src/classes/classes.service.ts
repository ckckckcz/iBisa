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
