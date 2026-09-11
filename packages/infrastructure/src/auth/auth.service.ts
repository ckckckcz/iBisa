import { getSupabase, getSupabaseAdmin } from "../supabase/client.js";

export type RoleName = "student" | "teacher" | "school";

export async function createUserWithProfile(p: {
  email: string; password: string; fullName: string; role: RoleName;
  schoolId?: string | null; whatsapp?: string | null;
}) {
  const admin = getSupabaseAdmin(), supabase = getSupabase();
  if (!admin || !supabase) throw new Error("Supabase not configured");

  const { data: role, error: roleErr } = await supabase.from("roles").select("id").eq("name", p.role).single();
  if (roleErr) throw new Error(roleErr.message);

  const { data: { user }, error: authErr } = await admin.auth.admin.createUser({
    email: p.email, password: p.password, email_confirm: true,
    user_metadata: { full_name: p.fullName, role: p.role },
  });
  if (authErr) throw new Error(authErr.message);
  if (!user) throw new Error("Failed to create user");

  const { error: profileErr } = await admin.from("users").insert({
    id: user.id, email: p.email, full_name: p.fullName,
    role_id: role.id, school_id: p.schoolId ?? null, whatsapp: p.whatsapp ?? null,
  });
  if (profileErr) {
    await admin.auth.admin.deleteUser(user.id).catch(() => {});
    throw new Error(profileErr.message);
  }
  return { userId: user.id };
}

export async function createSchoolWithManager(p: {
  school: { name: string; npsn: string; jenjang: string; alamat: string; kota: string; provinsi: string };
  manager: { fullName: string; email: string; password: string; whatsapp: string };
}) {
  const admin = getSupabaseAdmin();
  if (!admin) throw new Error("Supabase not configured");

  const { data: school, error } = await admin.from("schools").insert(p.school).select("id").single();
  if (error) throw new Error(error.message);

  try {
    const { userId } = await createUserWithProfile({ ...p.manager, role: "school", schoolId: school.id });
    return { schoolId: school.id as string, userId };
  } catch (e) {
    try { await admin.from("schools").delete().eq("id", school.id); } catch {}
    throw e;
  }
}

export async function signInWithPassword(email: string, password: string) {
  const supabase = getSupabase();
  const admin = getSupabaseAdmin();
  if (!supabase || !admin) throw new Error("Supabase not configured");
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.session) throw new Error(error?.message ?? "Invalid credentials");
  const { data: profile } = await admin
    .from("users_with_role").select("id,email,full_name,role,school_id").eq("id", data.user.id).single();
  return { session: data.session, user: data.user, profile: profile ?? null };
}
