"use client";

import { useState } from "react";
import Link from "next/link";
import { AuthSplit } from "@/features/auth/authSplit";

export default function Register() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [password, setPassword] = useState("");

  const calculateStrength = (val: string) => {
    let score = 0;
    if (val.length >= 8) score++;
    if (/[a-zA-Z]/.test(val)) score++;
    if (/[0-9]/.test(val)) score++;
    if (/[^a-zA-Z0-9]/.test(val)) score++;
    return score;
  };

  const strength = calculateStrength(password);

  const getStrengthLabel = () => {
    if (!password) return { text: "Strength", color: "text-neutral-400" };
    if (strength >= 4) return { text: "Strength: Strong", color: "text-emerald-600" };
    if (strength >= 2) return { text: "Strength: Medium", color: "text-yellow-600" };
    return { text: "Strength: Weak", color: "text-red-600" };
  };

  const getSegmentColor = (index: number) => {
    if (index >= strength) return "bg-neutral-200";
    if (strength >= 4) return "bg-emerald-500";
    if (strength >= 2) return "bg-yellow-500";
    return "bg-red-500";
  };

  const strengthInfo = getStrengthLabel();

  return (
    <AuthSplit
      mode="register"
      title="DAFTAR AKUN"
      subtitle="Buat akun untuk mengakses layanan pendampingan iBisa."
    >
      <form method="post" action="/register" className="space-y-5" noValidate>
        <div>
          <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-neutral-800">
            Nama Lengkap <span className="text-rose-600">*</span>
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            autoComplete="name"
            placeholder="Nama Anda"
            className="block w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-700/20 placeholder:text-neutral-400"
          />
        </div>

        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-neutral-800">
            Email <span className="text-rose-600">*</span>
          </label>
          <input
            id="email"
            name="email"
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
              name="password"
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              minLength={8}
              placeholder="••••••••"
              className="block w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 pr-12 text-sm outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-700/20 placeholder:text-neutral-400"
            />
            <button
              id="toggle-register-password"
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label="Toggle password visibility"
              className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-neutral-400 hover:text-neutral-700"
            >
              {showPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></svg>
              )}
            </button>
          </div>

          <div id="pw-meter" className="mt-2">
            <div className="flex gap-1.5">
              <span className={`h-1.5 flex-1 rounded-full transition-colors ${getSegmentColor(0)}`}></span>
              <span className={`h-1.5 flex-1 rounded-full transition-colors ${getSegmentColor(1)}`}></span>
              <span className={`h-1.5 flex-1 rounded-full transition-colors ${getSegmentColor(2)}`}></span>
              <span className={`h-1.5 flex-1 rounded-full transition-colors ${getSegmentColor(3)}`}></span>
            </div>
            <p className={`mt-2 text-xs font-medium ${strengthInfo.color}`}>{strengthInfo.text}</p>
          </div>
        </div>

        <div>
          <label htmlFor="confirm_password" className="mb-1.5 block text-sm font-medium text-neutral-800">
            Konfirmasi Password <span className="text-rose-600">*</span>
          </label>
          <div className="relative">
            <input
              id="confirm_password"
              name="confirm_password"
              type={showConfirmPassword ? "text" : "password"}
              required
              autoComplete="new-password"
              minLength={8}
              placeholder="••••••••"
              className="block w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 pr-12 text-sm outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-700/20 placeholder:text-neutral-400"
            />
            <button
              id="toggle-confirm-password"
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              aria-label="Toggle password visibility"
              className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-neutral-400 hover:text-neutral-700"
            >
              {showConfirmPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></svg>
              )}
            </button>
          </div>
          <p className="mt-1 text-xs text-neutral-400">Harus sama dengan password di atas.</p>
        </div>

        <button
          type="submit"
          className="mt-2 w-full rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-700/30 cursor-pointer"
        >
          Daftar Sekarang
        </button>

        <p className="mt-4 text-center text-xs text-neutral-500">
          Dengan mendaftar, Anda menyetujui{" "}
          <Link href="/terms" className="font-medium text-blue-700 hover:text-blue-800">Syarat &amp; Ketentuan</Link>{" "}
          serta{" "}
          <Link href="/privacy" className="font-medium text-blue-700 hover:text-blue-800">Kebijakan Privasi</Link>.
        </p>
      </form>
    </AuthSplit>
  );
}
