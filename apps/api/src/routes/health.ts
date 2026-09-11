import { Router, type Request, type Response } from "express";
import { getSupabase } from "@bisa/infrastructure";

const router = Router();

router.get("/", async (_req: Request, res: Response) => {
  const start = Date.now();
  const supabase = getSupabase();
  if (!supabase) {
    return res.status(503).json({
      success: false,
      connected: false,
      service: "supabase",
      message: "Supabase not configured — missing SUPABASE_URL / SUPABASE_ANON_KEY",
    });
  }
  try {
    const { error } = await supabase.auth.getSession();
    const latencyMs = Date.now() - start;
    if (error) {
      return res.status(503).json({
        success: false,
        connected: false,
        service: "supabase",
        latencyMs,
        message: error.message,
      });
    }
    return res.json({
      success: true,
      connected: true,
      service: "supabase",
      latencyMs,
      message: "Supabase connected",
    });
  } catch (e: any) {
    return res.status(503).json({
      success: false,
      connected: false,
      service: "supabase",
      latencyMs: Date.now() - start,
      message: e?.message ?? "Supabase connection failed",
    });
  }
});

export default router;
