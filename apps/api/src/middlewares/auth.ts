import type { Request, Response, NextFunction } from "express";
import { verifyToken, type RoleName } from "@bisa/infrastructure";

export async function authenticate(req: Request, res: Response, next: NextFunction) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) return res.status(401).json({ success: false, message: "Missing token" });
  try {
    const { profile, user } = await verifyToken(auth.slice(7));
    (req as any).user = user;
    (req as any).profile = profile;
    next();
  } catch (e: any) {
    return res.status(401).json({ success: false, message: e?.message ?? "Invalid token" });
  }
}

export function authorize(...roles: RoleName[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const profile = (req as any).profile;
    if (!profile || !roles.includes(profile.role)) return res.status(403).json({ success: false, message: "Forbidden" });
    next();
  };
}
