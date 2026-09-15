import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const clientOptions = {
  auth: { persistSession: false },
};

const createSupabaseClient = (url: string, key: string): SupabaseClient =>
  createClient(url, key, clientOptions);

function getEnv(name: string): string | undefined {
  return process.env[name];
}

export function getSupabase(): SupabaseClient | null {
  const url = getEnv("SUPABASE_URL");
  const key = getEnv("SUPABASE_ANON_KEY");
  if (!url || !key) return null;
  return createSupabaseClient(url, key);
}

export function getSupabaseAdmin(): SupabaseClient | null {
  const url = getEnv("SUPABASE_URL");
  const key = getEnv("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) return null;
  return createSupabaseClient(url, key);
}


