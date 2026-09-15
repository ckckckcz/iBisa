import { getSupabaseAdmin } from "../supabase/client.js";
import type { RoleName } from "./auth.service.js";

export async function verifyToken(token: string) {
  const admin = getSupabaseAdmin();
  if (!admin) throw new Error("Supabase not configured");
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data.user) {
    const m = (error?.message ?? "").toLowerCase();
    if (m.includes("expired")) throw new Error("Token expired, silakan login ulang");
    throw new Error("Invalid token");
  }
  const { data: profile } = await admin.from("users_with_role").select("*").eq("id", data.user.id).single();
  if (!profile) throw new Error("Profile not found");
  return { user: data.user, profile: profile as { id: string; email: string; full_name: string; role: RoleName; school_id: string | null } };
}


