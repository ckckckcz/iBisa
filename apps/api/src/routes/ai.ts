import { Router, type Request, type Response } from "express";
import { authenticate, authorize, type AuthenticatedRequest } from "../middlewares/auth.js";
import { getAiConfig, upsertAiConfig, chatWithAi } from "@bisa/infrastructure";

const router = Router();

function schoolId(req: Request) {
  return (req as AuthenticatedRequest).profile?.school_id ?? null;
}

function err(res: Response, status: number, message: string) {
  return res.status(status).json({ success: false, message });
}

router.get("/config", authenticate, authorize("school", "teacher"), async (req, res) => {
  const sid = schoolId(req);
  if (!sid) return err(res, 400, "Akun belum terhubung sekolah");
  const data = await getAiConfig(sid);
  return res.json({ success: true, data });
});

router.put("/config", authenticate, authorize("school"), async (req, res) => {
  const sid = schoolId(req);
  if (!sid) return err(res, 400, "Akun belum terhubung sekolah");
  const { system_prompt, soal_system_prompt, model } = req.body ?? {};
  if (!system_prompt || !model) return err(res, 400, "Prompt dan model wajib");
  const data = await upsertAiConfig(sid, { system_prompt, soal_system_prompt: typeof soal_system_prompt === "string" ? soal_system_prompt : "", model });
  return res.json({ success: true, data });
});

router.post("/chat", authenticate, authorize("school", "teacher"), async (req, res) => {
  const sid = schoolId(req);
  if (!sid) return err(res, 400, "Akun belum terhubung sekolah");
  const { messages } = req.body ?? {};
  if (!Array.isArray(messages) || messages.length === 0) return err(res, 400, "Messages wajib");
  try {
    const reply = await chatWithAi(sid, messages);
    return res.json({ success: true, data: reply });
  } catch (e) {
    return err(res, 500, e instanceof Error ? e.message : String(e));
  }
});

export default router;
