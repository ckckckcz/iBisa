import { getSupabaseAdmin } from "../supabase/client.js";
import { createUserWithProfile } from "../auth/auth.service.js";

export type MemberPatch = {
  full_name?: string; whatsapp?: string | null; number?: string | null;
  gender?: "male" | "female" | null; status?: "active" | "on_leave" | "inactive";
  avatar_url?: string | null; guardian_name?: string | null;
  attendance_pct?: number | null; grade?: string | null;
  subject?: string | null; class_id?: string | null;
};

const MEMBER_SELECT = "id,email,full_name,role,school_id,whatsapp,number,gender,status,avatar_url,guardian_name,attendance_pct,grade,subject,class_id,created_at";

export async function listMembers(schoolId: string, role: string) {
  const admin = getSupabaseAdmin();
  if (!admin) throw new Error("Supabase not configured");
  const { data, error } = await admin.from("users_with_role").select(MEMBER_SELECT).eq("school_id", schoolId).eq("role", role).order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data;
}

export async function createMember(schoolId: string, role: "teacher" | "student", p: { fullName: string; email: string; password: string; whatsapp?: string | null } & Omit<MemberPatch, "full_name" | "whatsapp">) {
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

export async function updateMember(userId: string, schoolId: string, patch: MemberPatch) {
  const admin = getSupabaseAdmin();
  if (!admin) throw new Error("Supabase not configured");
  const allowed: (keyof MemberPatch)[] = ["full_name", "whatsapp", "number", "gender", "status", "avatar_url", "guardian_name", "attendance_pct", "grade", "subject", "class_id"];
  const clean: Record<string, unknown> = {};
  for (const k of allowed) if (patch[k] !== undefined) clean[k] = patch[k] === "" ? null : patch[k];
  const { data, error } = await admin.from("users").update(clean).eq("id", userId).eq("school_id", schoolId).select("id,email,full_name,whatsapp,number,gender,status,avatar_url,guardian_name,attendance_pct,grade,subject,class_id").single();
  if (error) throw new Error(error.message);
  return data;
}
