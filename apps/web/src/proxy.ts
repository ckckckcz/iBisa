import { NextResponse, type NextRequest } from "next/server";

const roleRoutes: Record<string, string[]> = {
  school: ["/school", "/dashboard"],
  teacher: ["/teacher"],
  student: ["/student"],
};

function getRoleForPath(path: string) {
  if (path.startsWith("/school") || path.startsWith("/dashboard")) return "school";
  if (path.startsWith("/teacher")) return "teacher";
  if (path.startsWith("/student")) return "student";
  return null;
}

export async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const token = req.cookies.get("token")?.value;
  const requiredRole = getRoleForPath(path);
  if (!requiredRole) return NextResponse.next();

  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";
  try {
    const res = await fetch(`${apiUrl}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) throw new Error("unauthorized");
    const data = await res.json();
    const role = data.profile?.role as string | undefined;
    if (!role || !roleRoutes[role]?.some((p) => path.startsWith(p))) {
      if (role === "school") return NextResponse.redirect(new URL("/school", req.url));
      if (role === "teacher") return NextResponse.redirect(new URL("/teacher", req.url));
      if (role === "student") return NextResponse.redirect(new URL("/student", req.url));
      return NextResponse.redirect(new URL("/login", req.url));
    }
    if (role !== requiredRole) {
      const target = role === "school" ? "/school" : role === "teacher" ? "/teacher" : "/student";
      return NextResponse.redirect(new URL(target, req.url));
    }
    return NextResponse.next();
  } catch {
    const resp = NextResponse.redirect(new URL("/login", req.url));
    resp.cookies.delete("token");
    return resp;
  }
}

export default proxy;

export const config = {
  matcher: ["/school/:path*", "/teacher/:path*", "/student/:path*", "/dashboard/:path*"],
};
