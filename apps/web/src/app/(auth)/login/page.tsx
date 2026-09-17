"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { ViewIcon, ViewOffSlashIcon, Loading03Icon } from "@hugeicons/core-free-icons";
import { AuthSplit } from "@/features/auth/authSplit";

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";
  const navigatedRef = useRef(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      const hasCookie = document.cookie.split("; ").some((c) => c.startsWith("token="));
      if (!hasCookie) {
        localStorage.removeItem("token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("expires_at");
        localStorage.removeItem("profile");
      }
      try {
        const profileRaw = localStorage.getItem("profile");
        const profile = profileRaw ? JSON.parse(profileRaw) : null;
        const role = profile?.role;
        const target = role === "teacher" ? "/teacher" : role === "student" ? "/student" : "/school";
        router.replace(target);
      } catch {
        // ignore JSON parse error
      }
    }
  }, [router]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!email || !password) {
      setError("Email dan password wajib diisi");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message ?? "Login gagal");

      const maxAge = rememberMe ? 604800 : 3600; // 7 days vs 1 hour
      const enc = (v: string) => encodeURIComponent(v);
      document.cookie = `token=${enc(data.token)}; path=/; max-age=${maxAge}; SameSite=Lax`;
      localStorage.setItem("token", data.token);
      if (data.refresh_token) {
        document.cookie = `refresh_token=${enc(data.refresh_token)}; path=/; max-age=604800; SameSite=Lax`;
        localStorage.setItem("refresh_token", data.refresh_token);
      }
      if (data.expires_at) localStorage.setItem("expires_at", String(data.expires_at));
      if (data.profile) localStorage.setItem("profile", JSON.stringify(data.profile));
      else localStorage.removeItem("profile");

      const role = data.profile?.role;
      const target = role === "teacher" ? "/teacher" : role === "student" ? "/student" : "/school";
      navigatedRef.current = true;
      // Keep loading = true during navigation so the spinner/loading text stays visible until dashboard loads
      router.push(target);
      // Safety net: if client navigation stalls (e.g. slow middleware/API), force a full page load.
      window.setTimeout(() => {
        if (!navigatedRef.current && window.location.pathname.startsWith("/login")) {
          window.location.assign(target);
        }
      }, 6000);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setLoading(false);
    }
  }

  return (
    <AuthSplit
      mode="login"
      title="SELAMAT DATANG KEMBALI"
      subtitle="Masukkan email dan password Anda untuk mengakses akun."
    >
      <form onSubmit={submit} className="space-y-5" noValidate>
        {error ? <div className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div> : null}
        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-neutral-800">
            Email <span className="text-rose-600">*</span>
          </label>
          <input
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
            className="block w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-700/20 placeholder:text-neutral-400"
          />
        </div>
        <div>
          <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-neutral-800">
            Password <span className="text-rose-600">*</span>
          </label>
          <div className="relative">
            <input
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type={showPassword ? "text" : "password"}
              required
              autoComplete="current-password"
              minLength={8}
              placeholder="••••••••"
              className="block w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 pr-12 text-sm outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-700/20 placeholder:text-neutral-400"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label="Toggle password"
              className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-neutral-400 hover:text-neutral-700 cursor-pointer"
            >
              <HugeiconsIcon icon={showPassword ? ViewOffSlashIcon : ViewIcon} size={20} />
            </button>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm text-neutral-500 cursor-pointer">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 rounded border-neutral-300 accent-blue-700 cursor-pointer"
            />
            Ingat saya
          </label>
          <Link href="/forgot-password" className="text-sm font-medium text-blue-700 hover:text-blue-800">
            Lupa password?
          </Link>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-40 cursor-pointer"
        >
          {loading ? (
            <>
              <HugeiconsIcon icon={Loading03Icon} strokeWidth={2} className="size-4 animate-spin" />
              Memproses masuk...
            </>
          ) : (
            "Masuk"
          )}
        </button>
        <p className="mt-4 text-center text-xs text-neutral-500">
          Dengan melanjutkan, Anda menyetujui{" "}
          <Link href="/terms" className="font-medium text-blue-700">
            Syarat & Ketentuan
          </Link>{" "}
          serta{" "}
          <Link href="/privacy" className="font-medium text-blue-700">
            Kebijakan Privasi
          </Link>
          .
        </p>
      </form>
    </AuthSplit>
  );
}
