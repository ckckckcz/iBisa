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
export type ChatReply = { role: string; content: string; questions?: ApprovalQuestion[]; thoughts?: string[] };
export type ChatAttachment =
  | { kind: "image"; name: string; mimeType: string; data: string }
  | { kind: "text"; name: string; text: string };
export type ChatMessage = { role: string; content: string; attachments?: ChatAttachment[] };

const MAX_ATTACH_CHARS = 30000;

type OpenAiResponse = {
  error?: { message?: string };
  choices?: { message?: { role: string; content: string } }[];
};

type GeminiPart = { text?: string; thought?: boolean };
type GeminiResponse = {
  error?: { message?: string };
  candidates?: { content?: { parts?: GeminiPart[] } }[];
};

function thoughtsFromParts(parts: GeminiPart[]): string[] {
  const raw = parts.filter((p) => p.thought && p.text?.trim()).map((p) => p.text as string).join("\n");
  if (!raw) return [];
  const chunks = raw.split(/\n+/).flatMap((line) => line.replace(/^[-*•\d]+[.)\s]+/, "").split(/(?<=[.!?])\s+/));
  return [...new Set(chunks.map((s) => s.trim()).filter((s) => s.length > 3))].slice(0, 6);
}

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

function toGeminiParts(m: ChatMessage): unknown[] {
  const parts: unknown[] = [{ text: m.content }];
  for (const a of m.attachments?.slice(0, 3) ?? []) {
    if (a.kind === "image" && a.data) {
      parts.push({ inlineData: { mimeType: a.mimeType, data: a.data } });
    } else if (a.kind === "text" && a.text.trim()) {
      parts.push({ text: `[Lampiran ${a.name}]:\n${a.text.slice(0, MAX_ATTACH_CHARS)}` });
    }
  }
  return parts;
}

export type QuizDraftQuestion = {
  question: string;
  options: [string, string, string, string];
  answerIndex: number;
  explanation: string;
};

function quizSystemPrompt(count: number, subject: string): string {
  const mapel = subject.trim() ? ` untuk mapel ${subject.trim()}` : "";
  return `Kamu generator soal pilihan ganda Bahasa Indonesia untuk siswa. Berdasarkan MATERI pada lampiran/pesan berikut, buatkan TEPAT ${count} soal pilihan ganda${mapel}.
Aturan:
- Setiap soal punya tepat 4 opsi jawaban yang masuk akal.
- Tepat satu jawaban benar (answerIndex 0-3). Sebar posisi kunci jawaban, jangan selalu sama.
- explanation: 1-2 kalimat penjelasan jawaban benar, bahasa sederhana untuk anak.
- Kembalikan HANYA JSON valid tanpa teks lain, format:
{"questions":[{"question":"...","options":["...","...","...","..."],"answerIndex":0,"explanation":"..."}]}`;
}

function parseQuizDraft(text: string, count: number): QuizDraftQuestion[] | null {
  const m = text.match(/\{[\s\S]*"questions"[\s\S]*\}/);
  if (!m) return null;
  try {
    const j = JSON.parse(m[0]);
    if (!Array.isArray(j.questions)) return null;
    const out: QuizDraftQuestion[] = [];
    for (const x of j.questions) {
      if (typeof x?.question !== "string" || !x.question.trim()) continue;
      if (!Array.isArray(x?.options) || x.options.length !== 4) continue;
      const options = x.options.map((o: unknown) => String(o ?? "").trim());
      if (options.some((o: string) => !o)) continue;
      if (!Number.isInteger(x?.answerIndex) || x.answerIndex < 0 || x.answerIndex > 3) continue;
      out.push({
        question: x.question.trim(),
        options: options as [string, string, string, string],
        answerIndex: x.answerIndex,
        explanation: typeof x?.explanation === "string" ? x.explanation.trim() : "",
      });
      if (out.length >= count) break;
    }
    return out.length ? out : null;
  } catch {
    return null;
  }
}

export async function generateQuizDraft(
  schoolId: string,
  count: number,
  subject: string,
  messages: ChatMessage[]
): Promise<QuizDraftQuestion[]> {
  const config = await getAiConfig(schoolId);
  if (!config.model.startsWith("gemini")) {
    throw new Error("Model tidak mendukung baca file. Pakai model Gemini di Konfigurasi AI.");
  }
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY belum dikonfigurasi.");
  const n = Math.min(Math.max(Math.floor(count) || 5, 1), 20);
  const body = JSON.stringify({
    system_instruction: { parts: [{ text: quizSystemPrompt(n, subject) }] },
    contents: messages.map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: toGeminiParts(m) })),
  });
  const post = () =>
    fetch(`https://generativelanguage.googleapis.com/v1beta/models/${config.model}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      body,
    });
  let lastError = "AI error";
  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt > 0) await sleep(2000 * attempt);
    let res: Response;
    try {
      res = await post();
    } catch {
      lastError = "Koneksi ke AI terputus.";
      continue;
    }
    const data = (await res.json()) as GeminiResponse;
    if (res.ok) {
      const text = (data.candidates?.[0]?.content?.parts ?? []).map((p) => p.text ?? "").join("");
      const parsed = parseQuizDraft(text, n);
      if (parsed) return parsed;
      lastError = "AI tidak mengembalikan soal valid. Coba lagi.";
      break;
    }
    lastError = data.error?.message ?? "AI error";
    if (!isOverloaded(res.status, lastError)) break;
  }
  if (isOverloaded(0, lastError)) {
    throw new Error("Model AI sedang sibuk (permintaan membludak). Tunggu sebentar lalu coba lagi.");
  }
  throw new Error(lastError);
}

function isOverloaded(status: number, message: string): boolean {
  return status === 429 || status === 503 || /overload|high demand|try again later|rate limit|quota/i.test(message);
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export async function chatWithAi(schoolId: string, messages: ChatMessage[]): Promise<ChatReply> {
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

async function chatWithGemini(config: { system_prompt: string; model: string }, messages: ChatMessage[]): Promise<ChatReply> {
  const last = messages.at(-1)?.content ?? "";
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    const questions = mockQuestions(last);
    return { role: "assistant", content: `[mock ${config.model}] ${config.system_prompt.slice(0, 120)} | pesan: ${last}`, questions };
  }
  const base = {
    system_instruction: { parts: [{ text: `${config.system_prompt}\nFormat jawaban dengan markdown rapi: **bold** untuk penekanan, bullet (-) untuk daftar, tabel markdown bila perlu. Jangan pakai ASCII art.\nJika butuh klarifikasi sebelum menjawab, kembalikan JSON saja: {"content": "<kalimat pengantar singkat>", "questions": [{"q": "...", "type": "radio"|"check", "options": ["...", "..."]}]}. Maks 3 pertanyaan, tiap opsi maks 4.` }] },
    contents: messages.map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: toGeminiParts(m) })),
  };
  const body = { ...base, generationConfig: { thinkingConfig: { includeThoughts: true } } };

  const post = (payload: unknown) => fetch(`https://generativelanguage.googleapis.com/v1beta/models/${config.model}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": key },
    body: JSON.stringify(payload),
  });
  let res = await post(body);
  let data = (await res.json()) as GeminiResponse;
  if (!res.ok && /think/i.test(data.error?.message ?? "")) {
    res = await post(base);
    data = (await res.json()) as GeminiResponse;
  }
  if (!res.ok) throw new Error(data.error?.message ?? "AI error");
  const parts = data.candidates?.[0]?.content?.parts ?? [];
  const thoughts = thoughtsFromParts(parts);
  const text = parts.filter((p) => !p.thought).map((p) => p.text ?? "").join("") ?? "";
  const reply = parseReply(text);
  return thoughts.length ? { ...reply, thoughts } : reply;
}
