import { Router, type Request, type Response } from "express";
import { authenticate, authorize } from "../middlewares/auth.js";
import { synthesizeSpeech, DEFAULT_TTS_VOICE, TTS_MAX_CHARS } from "@bisa/infrastructure";

const router = Router();
router.use(authenticate, authorize("school", "teacher", "student"));

router.post("/", async (req: Request, res: Response) => {
  const text = String(req.body?.text ?? "").trim();
  const voice = String(req.body?.voice ?? DEFAULT_TTS_VOICE);
  if (!text) return res.status(400).json({ success: false, message: "Teks wajib diisi" });
  if (text.length > TTS_MAX_CHARS) return res.status(400).json({ success: false, message: `Teks maksimal ${TTS_MAX_CHARS} karakter` });
  try {
    const wav = await synthesizeSpeech(text, voice);
    res.set("Content-Type", "audio/wav").set("Cache-Control", "public, max-age=86400").send(wav);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "TTS gagal";
    return res.status(/belum dikonfigurasi/i.test(msg) ? 503 : 500).json({ success: false, message: msg });
  }
});

export default router;
