import { Router, type Request, type Response } from "express";
import { authenticate, authorize, type AuthenticatedRequest } from "../middlewares/auth.js";
import { getStudentDashboardData } from "@bisa/infrastructure";

const router = Router();
router.use(authenticate, authorize("student"));

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
    const data = await getStudentDashboardData(userId, schoolId);
    return res.json({
      success: true,
      profile: data.profile,
      class: data.class,
      wali: data.wali,
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
    const data = await getStudentDashboardData(userId, schoolId);
    return res.json({ success: true, data });
  } catch (e) {
    return err(res, 500, e instanceof Error ? e.message : String(e));
  }
});

export default router;
