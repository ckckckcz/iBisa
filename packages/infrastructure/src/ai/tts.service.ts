import { Buffer } from "node:buffer";
import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";

export type TtsProvider = "edge" | "gemini";

export type TtsVoiceInfo = { key: string; label: string; provider: TtsProvider };

export const EDGE_VOICES: TtsVoiceInfo[] = [
  { key: "id-ID-GadisNeural", label: "Gadis · wanita", provider: "edge" },
  { key: "id-ID-ArdiNeural", label: "Ardi · pria", provider: "edge" },
];

export const GEMINI_VOICES: TtsVoiceInfo[] = [
  { key: "Kore", label: "Kore · hangat", provider: "gemini" },
  { key: "Fenrir", label: "Fenrir · ceria", provider: "gemini" },
  { key: "Charon", label: "Charon · tenang", provider: "gemini" },
  { key: "Leda", label: "Leda · lembut", provider: "gemini" },
];

export const DEFAULT_TTS_VOICE: Record<TtsProvider, string> = {
  edge: "id-ID-GadisNeural",
  gemini: "Kore",
};

export const TTS_MAX_CHARS = 600;

const EDGE_TIMEOUT_MS = 20000;

export type TtsAudio = { data: Buffer; contentType: string };

const cache = new Map<string, TtsAudio>();

export function getTtsProvider(): TtsProvider {
  return (process.env.TTS_PROVIDER ?? "edge").toLowerCase() === "gemini" ? "gemini" : "edge";
}

export function getTtsVoices(provider: TtsProvider = getTtsProvider()): TtsVoiceInfo[] {
  return provider === "gemini" ? GEMINI_VOICES : EDGE_VOICES;
}

function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(message)), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      }
    );
  });
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

async function synthesizeEdge(text: string, voice: string): Promise<TtsAudio> {
  const tts = new MsEdgeTTS();
  try {
    await withTimeout(tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3), EDGE_TIMEOUT_MS, "TTS timeout");
    const { audioStream } = tts.toStream(escapeXml(text));
    const chunks: Buffer[] = [];
    await withTimeout(
      new Promise<void>((resolve, reject) => {
        audioStream.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
        audioStream.on("end", resolve);
        audioStream.on("close", resolve);
        audioStream.on("error", reject);
      }),
      EDGE_TIMEOUT_MS,
      "TTS timeout"
    );
    const data = Buffer.concat(chunks);
    if (!data.length) throw new Error("TTS tidak mengembalikan audio.");
    return { data, contentType: "audio/mpeg" };
  } finally {
    try {
      tts.close();
    } catch {}
  }
}

function wavHeader(pcmLen: number, sampleRate: number): Buffer {
  const h = Buffer.alloc(44);
  h.write("RIFF", 0);
  h.writeUInt32LE(36 + pcmLen, 4);
  h.write("WAVE", 8);
  h.write("fmt ", 12);
  h.writeUInt32LE(16, 16);
  h.writeUInt16LE(1, 20); // PCM
  h.writeUInt16LE(1, 22); // mono
  h.writeUInt32LE(sampleRate, 24);
  h.writeUInt32LE(sampleRate * 2, 28);
  h.writeUInt16LE(2, 32);
  h.writeUInt16LE(16, 34);
  h.write("data", 36);
  h.writeUInt32LE(pcmLen, 40);
  return h;
}

type TtsResponse = {
  error?: { message?: string };
  candidates?: { content?: { parts?: { inlineData?: { mimeType?: string; data?: string } }[] } }[];
};

async function synthesizeGemini(text: string, voice: string): Promise<TtsAudio> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY belum dikonfigurasi.");
  const model = process.env.GEMINI_TTS_MODEL ?? "gemini-2.5-flash-preview-tts";

  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
    body: JSON.stringify({
      contents: [{ parts: [{ text: `Bacakan dengan suara hangat dan ramah dalam Bahasa Indonesia:\n${text}` }] }],
      generationConfig: {
        responseModalities: ["AUDIO"],
        // Kunci ke Bahasa Indonesia — bukan voice English yang dipaksa ngomong BI.
        speechConfig: { languageCode: "id-ID", voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } },
      },
    }),
  });
  const data = (await res.json()) as TtsResponse;
  if (!res.ok) throw new Error(data.error?.message ?? "TTS error");
  const inline = data.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data)?.inlineData;
  if (!inline?.data) throw new Error("TTS tidak mengembalikan audio.");
  const rate = Number(/rate=(\d+)/.exec(inline.mimeType ?? "")?.[1] ?? 24000);
  const pcm = Buffer.from(inline.data, "base64");
  return { data: Buffer.concat([wavHeader(pcm.length, rate), pcm]), contentType: "audio/wav" };
}

export async function synthesizeSpeech(text: string, voice?: string): Promise<TtsAudio> {
  const clean = text.trim().slice(0, TTS_MAX_CHARS);
  if (!clean) throw new Error("Teks kosong");
  const provider = getTtsProvider();
  const v = voice && getTtsVoices(provider).some((item) => item.key === voice) ? voice : DEFAULT_TTS_VOICE[provider];
  const key = `${provider}:${v}:${clean}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const result = provider === "gemini" ? await synthesizeGemini(clean, v) : await synthesizeEdge(clean, v);
  if (cache.size >= 200) cache.delete(cache.keys().next().value as string);
  cache.set(key, result);
  return result;
}
