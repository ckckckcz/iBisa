import { Router, type Request, type Response } from "express";
import multer from "multer";
import { authenticate, authorize, type AuthenticatedRequest } from "../middlewares/auth.js";
import { listMembers, createMember, deleteMember, updateMember, createMembersBatch, getSchoolDashboardData, listQuizResults } from "@bisa/infrastructure";
import { uploadAvatar } from "@bisa/infrastructure";
import type { MemberCreateBody, MemberUpdateBody } from "@bisa/types";
import { listClasses, createClass, updateClass, deleteClass, getTeacherClassAssignments, updateTeacherAssignments } from "@bisa/infrastructure";

const router = Router();
router.use(authenticate, authorize("school"));

function schoolId(req: Request) {
  return (req as AuthenticatedRequest).profile?.school_id ?? null;
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
  const { full_name, email, password, whatsapp, number, gender, status, avatar_url, subject, grade, class_id, attendance_pct } = (req.body ?? {}) as MemberCreateBody;
  if (!full_name || !email) return err(res, 400, "Nama dan email wajib diisi");
  try {
    const r = await createMember(sid, "teacher", { fullName: full_name, email, password, whatsapp, number, gender, status, avatar_url, subject, grade, class_id, attendance_pct });
    return res.status(201).json({ success: true, ...r });
  } catch (e) {
    return err(res, 400, e instanceof Error ? e.message : String(e));
  }
});

router.get("/teachers/assignments", async (req, res) => {
  const sid = schoolId(req);
  if (!sid) return err(res, 400, "Akun belum terhubung sekolah");
  try {
    const data = await getTeacherClassAssignments(sid);
    return res.json({ success: true, data });
  } catch (e) {
    return err(res, 400, e instanceof Error ? e.message : String(e));
  }
});

router.post("/teachers/batch", async (req, res) => {
  const sid = schoolId(req);
  if (!sid) return err(res, 400, "Akun belum terhubung sekolah");
  const { items } = req.body ?? {};
  if (!Array.isArray(items) || items.length === 0) return err(res, 400, "Items wajib berupa array non-kosong");
  try {
    const summary = await createMembersBatch(sid, "teacher", items);
    return res.status(201).json({ success: true, data: summary });
  } catch (e) {
    return err(res, 400, e instanceof Error ? e.message : String(e));
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
  const { full_name, email, password, whatsapp, number, gender, status, avatar_url, guardian_name, grade, class_id, attendance_pct } = (req.body ?? {}) as MemberCreateBody;
  if (!full_name || !email) return err(res, 400, "Nama dan email wajib diisi");
  try {
    const r = await createMember(sid, "student", { fullName: full_name, email, password, whatsapp, number, gender, status, avatar_url, guardian_name, grade, class_id, attendance_pct });
    return res.status(201).json({ success: true, ...r });
  } catch (e) {
    return err(res, 400, e instanceof Error ? e.message : String(e));
  }
});

router.post("/students/batch", async (req, res) => {
  const sid = schoolId(req);
  if (!sid) return err(res, 400, "Akun belum terhubung sekolah");
  const { items } = req.body ?? {};
  if (!Array.isArray(items) || items.length === 0) return err(res, 400, "Items wajib berupa array non-kosong");
  try {
    const summary = await createMembersBatch(sid, "student", items);
    return res.status(201).json({ success: true, data: summary });
  } catch (e) {
    return err(res, 400, e instanceof Error ? e.message : String(e));
  }
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("File harus gambar"));
  },
});

router.post("/uploads/avatar", upload.single("avatar"), async (req, res) => {
  const sid = schoolId(req);
  if (!sid) return err(res, 400, "Akun belum terhubung sekolah");
  try {
    if (!req.file) return err(res, 400, "File wajib");
    const url = await uploadAvatar(sid, req.file.buffer, req.file.mimetype);
    return res.status(201).json({ success: true, url });
  } catch (e) {
    return err(res, 400, e instanceof Error ? e.message : String(e));
  }
});

router.delete("/users/:id", async (req, res) => {
  const sid = schoolId(req);
  const { id } = req.params;
  try {
    await deleteMember(id);
    return res.json({ success: true });
  } catch (e) {
    return err(res, 400, e instanceof Error ? e.message : String(e));
  }
});

router.put("/users/:id", async (req, res) => {
  const sid = schoolId(req);
  if (!sid) return err(res, 400, "Akun belum terhubung sekolah");
  const { id } = req.params;
  const { full_name, email, whatsapp, number, gender, status, avatar_url, guardian_name, grade, subject, class_id, attendance_pct, password } = (req.body ?? {}) as MemberUpdateBody & { password?: string };
  const { taught_class_ids, wali_class_id } = (req.body ?? {}) as { taught_class_ids?: string[]; wali_class_id?: string | null };
  try {
    const data = await updateMember(id, sid, { email, full_name, whatsapp, number, gender, status, avatar_url, guardian_name, grade, subject, class_id, attendance_pct, password });
    if (taught_class_ids !== undefined || wali_class_id !== undefined) {
      await updateTeacherAssignments(sid, id, {
        taughtClassIds: Array.isArray(taught_class_ids) ? taught_class_ids : [],
        waliClassId: wali_class_id ? String(wali_class_id) : null,
      });
    }
    return res.json({ success: true, data });
  } catch (e) {
    return err(res, 400, e instanceof Error ? e.message : String(e));
  }
});

router.get("/dashboard", async (req, res) => {
  const sid = schoolId(req);
  if (!sid) return err(res, 400, "Akun belum terhubung ke sekolah");
  try {
    const data = await getSchoolDashboardData(sid);
    return res.json({ success: true, data });
  } catch (e) {
    return err(res, 500, e instanceof Error ? e.message : String(e));
  }
});

router.get("/quiz-results", async (req, res) => {
  const sid = schoolId(req);
  if (!sid) return err(res, 400, "Akun belum terhubung ke sekolah");
  try {
    const results = await listQuizResults(sid);
    return res.json({ success: true, data: results });
  } catch (e) {
    return err(res, 500, e instanceof Error ? e.message : String(e));
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
  } catch (e) {
    return err(res, 400, e instanceof Error ? e.message : String(e));
  }
});

router.put("/classes/:id", async (req, res) => {
  const sid = schoolId(req);
  if (!sid) return err(res, 400, "Akun belum terhubung sekolah");
  try {
    const data = await updateClass(sid, req.params.id, req.body ?? {});
    return res.json({ success: true, data });
  } catch (e) {
    return err(res, 400, e instanceof Error ? e.message : String(e));
  }
});

router.delete("/classes/:id", async (req, res) => {
  const sid = schoolId(req);
  if (!sid) return err(res, 400, "Akun belum terhubung sekolah");
  try {
    await deleteClass(sid, req.params.id);
    return res.json({ success: true });
  } catch (e) {
    return err(res, 400, e instanceof Error ? e.message : String(e));
  }
});

export default router;
