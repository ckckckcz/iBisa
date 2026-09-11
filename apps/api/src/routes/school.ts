import { Router, type Request, type Response } from "express";
import { authenticate, authorize } from "../middlewares/auth.js";
import { listMembers, createMember, deleteMember, updateMember } from "@bisa/infrastructure";
import { listClasses, createClass, updateClass, deleteClass } from "@bisa/infrastructure";
import { getAiConfig, upsertAiConfig, chatWithAi } from "@bisa/infrastructure";

const router = Router();
router.use(authenticate, authorize("school"));

function schoolId(req: Request) {
  return (req as any).profile.school_id as string | null;
}

function err(res: Response, status: number, message: string) {
  return res.status(status).json({ success: false, message });
}

router.get("/teachers", async (req, res) => {
  const sid = schoolId(req);
  if (!sid) return err(res, 400, "Akun belum terhubung sekolah");
  const data = await listMembers(sid, "teacher");
  return res.json({ success: true, data });
});

router.post("/teachers", async (req, res) => {
  const sid = schoolId(req);
  if (!sid) return err(res, 400, "Akun belum terhubung sekolah");
  const { full_name, email, password, whatsapp } = req.body ?? {};
  if (!full_name || !email || !password) return err(res, 400, "Field wajib");
  try {
    const r = await createMember(sid, "teacher", { fullName: full_name, email, password, whatsapp });
    return res.status(201).json({ success: true, ...r });
  } catch (e: any) {
    return err(res, 400, e.message);
  }
});

router.get("/students", async (req, res) => {
  const sid = schoolId(req);
  if (!sid) return err(res, 400, "Akun belum terhubung sekolah");
  const data = await listMembers(sid, "student");
  return res.json({ success: true, data });
});

router.post("/students", async (req, res) => {
  const sid = schoolId(req);
  if (!sid) return err(res, 400, "Akun belum terhubung sekolah");
  const { full_name, email, password, whatsapp } = req.body ?? {};
  if (!full_name || !email || !password) return err(res, 400, "Field wajib");
  try {
    const r = await createMember(sid, "student", { fullName: full_name, email, password, whatsapp });
    return res.status(201).json({ success: true, ...r });
  } catch (e: any) {
    return err(res, 400, e.message);
  }
});

router.delete("/users/:id", async (req, res) => {
  const sid = schoolId(req);
  const { id } = req.params;
  try {
    await deleteMember(id);
    return res.json({ success: true });
  } catch (e: any) {
    return err(res, 400, e.message);
  }
});

router.put("/users/:id", async (req, res) => {
  const sid = schoolId(req);
  if (!sid) return err(res, 400, "Akun belum terhubung sekolah");
  const { id } = req.params;
  const { full_name, whatsapp } = req.body ?? {};
  try {
    const data = await updateMember(id, sid, { full_name, whatsapp });
    return res.json({ success: true, data });
  } catch (e: any) {
    return err(res, 400, e.message);
  }
});

router.get("/classes", async (req, res) => {
  const sid = schoolId(req);
  if (!sid) return err(res, 400, "Akun belum terhubung sekolah");
  const data = await listClasses(sid);
  return res.json({ success: true, data });
});

router.post("/classes", async (req, res) => {
  const sid = schoolId(req);
  if (!sid) return err(res, 400, "Akun belum terhubung sekolah");
  const { name, tingkat, wali_guru_id } = req.body ?? {};
  if (!name || !tingkat) return err(res, 400, "Nama dan tingkat wajib");
  try {
    const data = await createClass(sid, { name, tingkat, wali_guru_id });
    return res.status(201).json({ success: true, data });
  } catch (e: any) {
    return err(res, 400, e.message);
  }
});

router.put("/classes/:id", async (req, res) => {
  const sid = schoolId(req);
  if (!sid) return err(res, 400, "Akun belum terhubung sekolah");
  try {
    const data = await updateClass(sid, req.params.id, req.body ?? {});
    return res.json({ success: true, data });
  } catch (e: any) {
    return err(res, 400, e.message);
  }
});

router.delete("/classes/:id", async (req, res) => {
  const sid = schoolId(req);
  if (!sid) return err(res, 400, "Akun belum terhubung sekolah");
  try {
    await deleteClass(sid, req.params.id);
    return res.json({ success: true });
  } catch (e: any) {
    return err(res, 400, e.message);
  }
});

router.get("/ai/config", async (req, res) => {
  const sid = schoolId(req);
  if (!sid) return err(res, 400, "Akun belum terhubung sekolah");
  const data = await getAiConfig(sid);
  return res.json({ success: true, data });
});

router.put("/ai/config", async (req, res) => {
  const sid = schoolId(req);
  if (!sid) return err(res, 400, "Akun belum terhubung sekolah");
  const { system_prompt, model } = req.body ?? {};
  if (!system_prompt || !model) return err(res, 400, "Prompt dan model wajib");
  const data = await upsertAiConfig(sid, { system_prompt, model });
  return res.json({ success: true, data });
});

router.post("/ai/chat", async (req, res) => {
  const sid = schoolId(req);
  if (!sid) return err(res, 400, "Akun belum terhubung sekolah");
  const { messages } = req.body ?? {};
  if (!Array.isArray(messages) || messages.length === 0) return err(res, 400, "Messages wajib");
  try {
    const reply = await chatWithAi(sid, messages);
    return res.json({ success: true, data: reply });
  } catch (e: any) {
    return err(res, 500, e.message);
  }
});

export default router;
