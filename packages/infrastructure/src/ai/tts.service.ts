import { Buffer } from "node:buffer";


export const TTS_VOICES = ["Kore", "Fenrir", "Charon", "Leda", "Puck", "Aoede"] as const;
export type TtsVoice = (typeof TTS_VOICES)[number];
export const DEFAULT_TTS_VOICE: TtsVoice = "Kore";
export const TTS_MAX_CHARS = 600;

const cache = new Map<string, Buffer>();

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

export async function synthesizeSpeech(text: string, voice: string = DEFAULT_TTS_VOICE): Promise<Buffer> {
  const clean = text.trim().slice(0, TTS_MAX_CHARS);
  if (!clean) throw new Error("Teks kosong");
  const v = (TTS_VOICES as readonly string[]).includes(voice) ? voice : DEFAULT_TTS_VOICE;
  const key = `${v}:${clean}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY belum dikonfigurasi.");
  const model = process.env.GEMINI_TTS_MODEL ?? "gemini-2.5-flash-preview-tts";

  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
    body: JSON.stringify({
      contents: [{ parts: [{ text: `Bacakan dengan suara hangat dan ramah dalam Bahasa Indonesia:\n${clean}` }] }],
      generationConfig: {
        responseModalities: ["AUDIO"],
        // Kunci ke Bahasa Indonesia — bukan voice English yang dipaksa ngomong BI.
        speechConfig: { languageCode: "id-ID", voiceConfig: { prebuiltVoiceConfig: { voiceName: v } } },
      },
    }),
  });
  const data = (await res.json()) as TtsResponse;
  if (!res.ok) throw new Error(data.error?.message ?? "TTS error");
  const inline = data.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data)?.inlineData;
  if (!inline?.data) throw new Error("TTS tidak mengembalikan audio.");
  const rate = Number(/rate=(\d+)/.exec(inline.mimeType ?? "")?.[1] ?? 24000);
  const pcm = Buffer.from(inline.data, "base64");
  const wav = Buffer.concat([wavHeader(pcm.length, rate), pcm]);
  if (cache.size >= 200) cache.delete(cache.keys().next().value as string);
  cache.set(key, wav);
  return wav;
}
