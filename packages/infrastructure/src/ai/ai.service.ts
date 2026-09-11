import { getSupabaseAdmin } from "../supabase/client.js";

export async function getAiConfig(schoolId: string) {
  const admin = getSupabaseAdmin();
  if (!admin) throw new Error("Supabase not configured");
  const { data } = await admin.from("ai_configs").select("system_prompt,model").eq("school_id", schoolId).single();
  if (data) return data as { system_prompt: string; model: string };
  return { system_prompt: "Kamu asisten BISA ramah untuk ABK.", model: "gpt-4o-mini" };
}

export async function upsertAiConfig(schoolId: string, p: { system_prompt: string; model: string }) {
  const admin = getSupabaseAdmin();
  if (!admin) throw new Error("Supabase not configured");
  const { data, error } = await admin.from("ai_configs").upsert({ school_id: schoolId, system_prompt: p.system_prompt, model: p.model, updated_at: new Date().toISOString() }).select("system_prompt,model").single();
  if (error) throw new Error(error.message);
  return data;
}

export async function chatWithAi(schoolId: string, messages: { role: string; content: string }[]) {
  const config = await getAiConfig(schoolId);
  const key = process.env.OPENAI_API_KEY;
  if (!key) return { role: "assistant", content: `[mock ${config.model}] ${config.system_prompt.slice(0,120)} | pesan: ${messages.at(-1)?.content ?? ""}` };
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({ model: config.model, messages: [{ role: "system", content: config.system_prompt }, ...messages] }),
  });
  const data: any = await res.json();
  if (!res.ok) throw new Error(data.error?.message ?? "AI error");
  return data.choices[0].message as { role: string; content: string };
}
