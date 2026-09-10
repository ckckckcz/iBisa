"use client";

import { useState } from "react";
import Link from "next/link";
import { AuthSplit } from "@/features/auth/authSplit";

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <AuthSplit
      mode="login"
      title="WELCOME BACK"
      subtitle="Enter your credentials to access your account."
    >
      <form method="post" action="/login" className="space-y-5" noValidate>
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
              autoComplete="current-password"
              minLength={8}
              placeholder="••••••••"
              className="block w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 pr-12 text-sm outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-700/20 placeholder:text-neutral-400"
            />
            <button
              id="toggle-login-password"
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
          <p className="mt-1 text-xs text-emerald-600">Min. 8 characters</p>
        </div>

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm text-neutral-500">
            <input
              type="checkbox"
              name="remember"
              className="h-4 w-4 rounded border-neutral-300 accent-blue-700"
            />
            Remember me
          </label>
          <Link href="/forgot-password" className="text-sm font-medium text-blue-700 hover:text-blue-800">
            Forgot password?
          </Link>
        </div>

        <button
          type="submit"
          className="mt-2 w-full rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-700/30 cursor-pointer"
        >
          Sign in
        </button>

        <p className="mt-4 text-center text-xs text-neutral-500">
          By continuing, you agree to our{" "}
          <Link href="/terms" className="font-medium text-blue-700 hover:text-blue-800">Terms of Service</Link>{" "}
          and{" "}
          <Link href="/privacy" className="font-medium text-blue-700 hover:text-blue-800">Privacy Policy</Link>.
        </p>
      </form>
    </AuthSplit>
  );
}
