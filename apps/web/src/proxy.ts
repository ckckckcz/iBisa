import { NextResponse, type NextRequest } from "next/server";

const roleRoutes: Record<string, string[]> = {
  school: ["/school"],
  teacher: ["/teacher"],
  student: ["/student"],
};

function getRoleForPath(path: string) {
  if (path.startsWith("/school")) return "school";
  if (path.startsWith("/teacher")) return "teacher";
  if (path.startsWith("/student")) return "student";
  return null;
}

function decodeExp(token: string): number | null {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const b64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const pad = b64.length % 4 ? "=".repeat(4 - (b64.length % 4)) : "";
    const obj = JSON.parse(atob(b64 + pad)) as { exp?: number };
    return typeof obj.exp === "number" ? obj.exp : null;
  } catch {
    return null;
  }
}

async function fetchWithTimeout(url: string, init: RequestInit, ms = 5000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: controller.signal, cache: "no-store" });
  } finally {
    clearTimeout(timer);
  }
}

async function verifyToken(token: string) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";
  const res = await fetchWithTimeout(`${apiUrl}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("unauthorized");
  return (await res.json()) as { profile?: { role?: string } | null };
}

function roleTarget(role: string) {
  if (role === "teacher") return "/teacher";
  if (role === "student") return "/student";
  return "/school";
}

function clearToken(resp: NextResponse) {
  resp.cookies.delete("token");
  resp.cookies.delete("refresh_token");
  return resp;
}

export async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const token = req.cookies.get("token")?.value;
  const isAuthPage = path === "/login" || path === "/register";
  const requiredRole = getRoleForPath(path);

  if (isAuthPage) {
    if (!token) return NextResponse.next();
    try {
      const data = await verifyToken(token);
      const role = (data.profile?.role as string | undefined) ?? "school";
      return NextResponse.redirect(new URL(roleTarget(role), req.url));
    } catch {
      return clearToken(NextResponse.next());
    }
  }

  if (!requiredRole) return NextResponse.next();

  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const exp = decodeExp(token);
  const nowSeconds = Math.floor(Date.now() / 1000);
  if (exp !== null && exp > nowSeconds + 60) {
    return NextResponse.next();
  }

  try {
    const data = await verifyToken(token);
    const role = (data.profile?.role as string | undefined) ?? "";
    if (!role || !roleRoutes[role]?.some((p) => path.startsWith(p))) {
      return NextResponse.redirect(new URL(role ? roleTarget(role) : "/login", req.url));
    }
    return NextResponse.next();
  } catch {
    return clearToken(NextResponse.redirect(new URL("/login", req.url)));
  }
}

export const config = {
  matcher: [
    "/school/:path*",
    "/teacher/:path*",
    "/student/:path*",
    "/login",
    "/register",
  ],
};