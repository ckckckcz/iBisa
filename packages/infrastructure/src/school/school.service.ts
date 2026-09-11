import { getSupabaseAdmin } from "../supabase/client.js";
import { createUserWithProfile } from "../auth/auth.service.js";

export async function listMembers(schoolId: string, role: string) {
  const admin = getSupabaseAdmin();
  if (!admin) throw new Error("Supabase not configured");
  const { data, error } = await admin.from("users_with_role").select("id,email,full_name,role,school_id,whatsapp,created_at").eq("school_id", schoolId).eq("role", role);
  if (error) throw new Error(error.message);
  return data;
}

export async function createMember(schoolId: string, role: "teacher" | "student", p: { fullName: string; email: string; password: string; whatsapp?: string | null }) {
  return createUserWithProfile({ email: p.email, password: p.password, fullName: p.fullName, role, schoolId, whatsapp: p.whatsapp ?? null });
}

export async function deleteMember(userId: string) {
  const admin = getSupabaseAdmin();
  if (!admin) throw new Error("Supabase not configured");
  const { error: delProfile } = await admin.from("users").delete().eq("id", userId);
  if (delProfile) throw new Error(delProfile.message);
  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) throw new Error(error.message);
}

export async function updateMember(userId: string, schoolId: string, patch: { full_name?: string; whatsapp?: string }) {
  const admin = getSupabaseAdmin();
  if (!admin) throw new Error("Supabase not configured");
  const { data, error } = await admin.from("users").update(patch).eq("id", userId).eq("school_id", schoolId).select("id,email,full_name,whatsapp").single();
  if (error) throw new Error(error.message);
  return data;
}
