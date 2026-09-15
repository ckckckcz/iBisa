import { Router, type Request, type Response } from "express";
import { authenticate, authorize, type AuthenticatedRequest } from "../middlewares/auth.js";
import { generateQuizDraft, createQuiz, listQuizzes, getQuizByCode, type ChatMessage } from "@bisa/infrastructure";

const router = Router();

function ctx(req: Request) {
  const auth = req as AuthenticatedRequest;
  return { schoolId: auth.profile?.school_id ?? null, userId: auth.user?.id ?? null };
}

function err(res: Response, status: number, message: string) {
  return res.status(status).json({ success: false, message });
}

function fail(res: Response, e: unknown) {
  return err(res, 500, e instanceof Error ? e.message : String(e));
}

router.post("/ai/generate-quiz", authenticate, authorize("school", "teacher"), async (req, res) => {
  const { schoolId } = ctx(req);
  if (!schoolId) return err(res, 400, "Akun belum terhubung sekolah");
  const { count, subject, messages } = req.body ?? {};
  if (!Array.isArray(messages) || messages.length === 0) return err(res, 400, "Lampirkan materi dulu.");
  try {
    const questions = await generateQuizDraft(schoolId, Number(count) || 5, String(subject ?? ""), messages as ChatMessage[]);
    return res.json({ success: true, data: { questions } });
  } catch (e) {
    return fail(res, e);
  }
});

router.post("/", authenticate, authorize("school", "teacher"), async (req, res) => {
  const { schoolId, userId } = ctx(req);
  if (!schoolId) return err(res, 400, "Akun belum terhubung sekolah");
  try {
    const data = await createQuiz(schoolId, userId, req.body ?? {});
    return res.json({ success: true, data });
  } catch (e) {
    return err(res, 400, e instanceof Error ? e.message : String(e));
  }
});

router.get("/", authenticate, authorize("school", "teacher", "student"), async (req, res) => {
  const { schoolId } = ctx(req);
  if (!schoolId) return err(res, 400, "Akun belum terhubung sekolah");
  try {
    const data = await listQuizzes(schoolId);
    return res.json({ success: true, data });
  } catch (e) {
    return fail(res, e);
  }
});

router.get("/by-code/:code", authenticate, authorize("school", "teacher", "student"), async (req, res) => {
  try {
    const data = await getQuizByCode(req.params.code ?? "");
    if (!data) return err(res, 404, "Kode tidak ditemukan.");
    return res.json({ success: true, data });
  } catch (e) {
    return fail(res, e);
  }
});

export default router;
