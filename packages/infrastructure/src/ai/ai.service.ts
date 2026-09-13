import { getSupabaseAdmin } from "../supabase/client.js";

export async function getAiConfig(schoolId: string) {
  const admin = getSupabaseAdmin();
  if (!admin) throw new Error("Supabase not configured");
  const { data } = await admin.from("ai_configs").select("system_prompt,model").eq("school_id", schoolId).single();
  if (data) return data as { system_prompt: string; model: string };
  return { system_prompt: "Kamu asisten BISA ramah untuk ABK.", model: "gemini-3.6-flash" };
}

export async function upsertAiConfig(schoolId: string, p: { system_prompt: string; model: string }) {
  const admin = getSupabaseAdmin();
  if (!admin) throw new Error("Supabase not configured");
  const { data, error } = await admin.from("ai_configs").upsert({ school_id: schoolId, system_prompt: p.system_prompt, model: p.model, updated_at: new Date().toISOString() }).select("system_prompt,model").single();
  if (error) throw new Error(error.message);
  return data;
}

export type ApprovalQuestion = { q: string; type: "radio" | "check"; options: string[] };
export type ChatReply = { role: string; content: string; questions?: ApprovalQuestion[] };

type OpenAiResponse = {
  error?: { message?: string };
  choices?: { message?: { role: string; content: string } }[];
};

type GeminiResponse = {
  error?: { message?: string };
  candidates?: { content?: { parts?: { text?: string }[] } }[];
};

function parseReply(text: string): ChatReply {
  const m = text.match(/\{[\s\S]*"questions"[\s\S]*\}/);
  if (!m) return { role: "assistant", content: text };
  try {
    const j = JSON.parse(m[0]);
    if (!Array.isArray(j.questions)) return { role: "assistant", content: text };
    const questions = j.questions
      .filter((x: { q?: string; type?: string; options?: string[] }) => x?.q && Array.isArray(x?.options))
      .slice(0, 3)
      .map((x: { q?: string; type?: string; options?: string[] }) => ({ q: String(x.q), type: x.type === "check" ? "check" as const : "radio" as const, options: (x.options ?? []).map(String).slice(0, 4) }));
    if (!questions.length) return { role: "assistant", content: text };
    return { role: "assistant", content: String(j.content ?? text), questions };
  } catch { return { role: "assistant", content: text }; }
}

function mockQuestions(last: string): ApprovalQuestion[] | undefined {
  const s = last.toLowerCase();
  if (s.includes("jadwal") && !s.includes("kelas")) return [{ q: "Jadwal untuk kelas berapa?", type: "radio", options: ["Kelas 4", "Kelas 5", "Kelas 6"] }];
  if ((s.includes("surat") || s.includes("undangan")) && !s.includes("rapat") && !s.includes("wali")) return [{ q: "Surat untuk keperluan apa?", type: "radio", options: ["Rapat orang tua", "Kegiatan sekolah", "Pemberitahuan wali"] }];
  return undefined;
}

export async function chatWithAi(schoolId: string, messages: { role: string; content: string }[]): Promise<ChatReply> {
  const config = await getAiConfig(schoolId);
  if (config.model.startsWith("gemini")) return chatWithGemini(config, messages);
  const key = process.env.OPENAI_API_KEY;
  if (!key) return { role: "assistant", content: `[mock ${config.model}] ${config.system_prompt.slice(0,120)} | pesan: ${messages.at(-1)?.content ?? ""}` };
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({ model: config.model, messages: [{ role: "system", content: config.system_prompt }, ...messages] }),
  });
  const data = (await res.json()) as OpenAiResponse;
  if (!res.ok) throw new Error(data.error?.message ?? "AI error");
  return data.choices?.[0]?.message ?? { role: "assistant", content: "" };
}

async function chatWithGemini(config: { system_prompt: string; model: string }, messages: { role: string; content: string }[]): Promise<ChatReply> {
  const last = messages.at(-1)?.content ?? "";
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    const questions = mockQuestions(last);
    return { role: "assistant", content: `[mock ${config.model}] ${config.system_prompt.slice(0, 120)} | pesan: ${last}`, questions };
  }
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${config.model}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": key },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: `${config.system_prompt}\nFormat jawaban dengan markdown rapi: **bold** untuk penekanan, bullet (-) untuk daftar, tabel markdown bila perlu. Jangan pakai ASCII art.\nJika butuh klarifikasi sebelum menjawab, kembalikan JSON saja: {"content": "<kalimat pengantar singkat>", "questions": [{"q": "...", "type": "radio"|"check", "options": ["...", "..."]}]}. Maks 3 pertanyaan, tiap opsi maks 4.` }] },
      contents: messages.map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] })),
    }),
  });
  const data = (await res.json()) as GeminiResponse;
  if (!res.ok) throw new Error(data.error?.message ?? "AI error");
  const text = data.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? "").join("") ?? "";
  return parseReply(text);
}
