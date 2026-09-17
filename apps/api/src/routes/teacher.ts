import { Router, type Request, type Response } from "express";
import { authenticate, authorize, type AuthenticatedRequest } from "../middlewares/auth.js";
import { getTeacherDashboardData, getTeacherQuizStats, listQuizResults } from "@bisa/infrastructure";

const router = Router();
router.use(authenticate, authorize("teacher"));

function err(res: Response, status: number, message: string) {
  return res.status(status).json({ success: false, message });
}

router.get("/me", async (req: Request, res: Response) => {
  const reqAuth = req as AuthenticatedRequest;
  const userId = reqAuth.user?.id;
  const schoolId = reqAuth.profile?.school_id;

  if (!userId || !schoolId) {
    return res.json({
      success: true,
      profile: reqAuth.profile ?? null,
      dashboard: null,
    });
  }

  try {
    const data = await getTeacherDashboardData(userId, schoolId);
    const stats = await getTeacherQuizStats(schoolId, (data.students ?? []).length);
    return res.json({
      success: true,
      profile: data.profile,
      classesTaught: data.classesTaught,
      waliClasses: data.waliClasses,
      students: data.students,
      stats,
    });
  } catch (e) {
    return err(res, 500, e instanceof Error ? e.message : String(e));
  }
});

router.get("/dashboard", async (req: Request, res: Response) => {
  const reqAuth = req as AuthenticatedRequest;
  const userId = reqAuth.user?.id;
  const schoolId = reqAuth.profile?.school_id;

  if (!userId || !schoolId) {
    return err(res, 400, "Akun belum terhubung ke sekolah");
  }

  try {
    const data = await getTeacherDashboardData(userId, schoolId);
    const stats = await getTeacherQuizStats(schoolId, (data.students ?? []).length);
    return res.json({ success: true, data: { ...data, stats } });
  } catch (e) {
    return err(res, 500, e instanceof Error ? e.message : String(e));
  }
});

router.get("/quiz-results", async (req: Request, res: Response) => {
  const reqAuth = req as AuthenticatedRequest;
  const schoolId = reqAuth.profile?.school_id;

  if (!schoolId) {
    return err(res, 400, "Akun belum terhubung ke sekolah");
  }

  try {
    const results = await listQuizResults(schoolId);
    return res.json({ success: true, data: results });
  } catch (e) {
    return err(res, 500, e instanceof Error ? e.message : String(e));
  }
});

export default router;
