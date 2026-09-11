import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export const createSupabaseClient = (url: string, key: string): SupabaseClient =>
  createClient(url, key);

function getEnv(name: string): string | undefined {
  return process.env[name];
}

export function getSupabase(): SupabaseClient | null {
  const url = getEnv("SUPABASE_URL");
  const key = getEnv("SUPABASE_ANON_KEY");
  if (!url || !key) return null;
  return createClient(url, key);
}

export function getSupabaseAdmin(): SupabaseClient | null {
  const url = getEnv("SUPABASE_URL");
  const key = getEnv("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) return null;
  return createClient(url, key);
}

export const supabase = null as unknown as SupabaseClient | null;
export const supabaseAdmin = null as unknown as SupabaseClient | null;

export function requireSupabase(): SupabaseClient {
  const client = getSupabase();
  if (!client) throw new Error("Missing SUPABASE_URL / SUPABASE_ANON_KEY");
  return client;
}

export function requireSupabaseAdmin(): SupabaseClient {
  const client = getSupabaseAdmin();
  if (!client) throw new Error("Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY");
  return client;
}
