import type { Request, Response, NextFunction } from "express";
import { verifyToken, type RoleName } from "@bisa/infrastructure";

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: RoleName;
  school_id: string | null;
}

export interface AuthenticatedRequest extends Request {
  user?: Awaited<ReturnType<typeof verifyToken>>["user"];
  profile?: UserProfile;
}

export async function authenticate(req: Request, res: Response, next: NextFunction) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) return res.status(401).json({ success: false, message: "Missing token" });
  try {
    const { profile, user } = await verifyToken(auth.slice(7));
    (req as AuthenticatedRequest).user = user;
    (req as AuthenticatedRequest).profile = profile;
    next();
  } catch (e) {
    const message = e instanceof Error ? e.message : "Invalid token";
    return res.status(401).json({ success: false, message });
  }
}

export function authorize(...roles: RoleName[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const profile = (req as AuthenticatedRequest).profile;
    if (!profile || !roles.includes(profile.role)) return res.status(403).json({ success: false, message: "Forbidden" });
    next();
  };
}
