"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { ViewIcon, ViewOffSlashIcon } from "@hugeicons/core-free-icons";
import { AuthSplit } from "@/features/auth/authSplit";

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

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
      document.cookie = `token=${data.token}; path=/; max-age=3600; SameSite=Lax`;
      localStorage.setItem("token", data.token);
      if (data.profile) localStorage.setItem("profile", JSON.stringify(data.profile));
      else localStorage.removeItem("profile");
      const role = data.profile?.role;
      if (role === "school") router.push("/school");
      else if (role === "teacher") router.push("/teacher");
      else if (role === "student") router.push("/student");
      else router.push("/school");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthSplit mode="login" title="WELCOME BACK" subtitle="Enter your credentials to access your account.">
      <form onSubmit={submit} className="space-y-5" noValidate>
        {error ? <div className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div> : null}
        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-neutral-800">Email <span className="text-rose-600">*</span></label>
          <input id="email" value={email} onChange={(e) => setEmail(e.target.value)} type="email" required autoComplete="email" placeholder="you@example.com" className="block w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-700/20 placeholder:text-neutral-400" />
        </div>
        <div>
          <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-neutral-800">Password <span className="text-rose-600">*</span></label>
          <div className="relative">
            <input id="password" value={password} onChange={(e) => setPassword(e.target.value)} type={showPassword ? "text" : "password"} required autoComplete="current-password" minLength={8} placeholder="••••••••" className="block w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 pr-12 text-sm outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-700/20 placeholder:text-neutral-400" />
            <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label="Toggle password" className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-neutral-400 hover:text-neutral-700"><HugeiconsIcon icon={showPassword ? ViewOffSlashIcon : ViewIcon} size={20} /></button>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm text-neutral-500"><input type="checkbox" className="h-4 w-4 rounded border-neutral-300 accent-blue-700" /> Remember me</label>
          <Link href="/forgot-password" className="text-sm font-medium text-blue-700 hover:text-blue-800">Forgot password?</Link>
        </div>
        <button type="submit" disabled={loading} className="mt-2 w-full rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-40 cursor-pointer">{loading ? "Signing in..." : "Sign in"}</button>
        <p className="mt-4 text-center text-xs text-neutral-500">By continuing, you agree to our <Link href="/terms" className="font-medium text-blue-700">Terms</Link> and <Link href="/privacy" className="font-medium text-blue-700">Privacy</Link>.</p>
      </form>
    </AuthSplit>
  );
}
