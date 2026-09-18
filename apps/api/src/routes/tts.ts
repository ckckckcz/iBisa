import { Router, type Request, type Response } from "express";
import { authenticate, authorize } from "../middlewares/auth.js";
import { synthesizeSpeech, getTtsProvider, getTtsVoices, TTS_MAX_CHARS } from "@bisa/infrastructure";

const router = Router();
router.use(authenticate, authorize("school", "teacher", "student"));

router.get("/voices", (_req: Request, res: Response) => {
  return res.json({ success: true, provider: getTtsProvider(), voices: getTtsVoices() });
});

router.post("/", async (req: Request, res: Response) => {
  const text = String(req.body?.text ?? "").trim();
  const voice = req.body?.voice ? String(req.body.voice) : undefined;
  if (!text) return res.status(400).json({ success: false, message: "Teks wajib diisi" });
  if (text.length > TTS_MAX_CHARS) return res.status(400).json({ success: false, message: `Teks maksimal ${TTS_MAX_CHARS} karakter` });
  try {
    const audio = await synthesizeSpeech(text, voice);
    res.set("Content-Type", audio.contentType).set("Cache-Control", "public, max-age=86400").send(audio.data);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "TTS gagal";
    return res.status(/belum dikonfigurasi/i.test(msg) ? 503 : 502).json({ success: false, message: msg });
  }
});

export default router;
