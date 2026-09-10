import * as React from "react";
import Link from "next/link";

export type AuthMode = "login" | "register";

interface AuthSplitProps {
  mode: AuthMode;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export function AuthSplit({ mode, title, subtitle, children }: AuthSplitProps) {
  const isLogin = mode === "login";
  const nextVerb = isLogin ? "register" : "login";
  const nextLabel = isLogin ? "Sign up" : "Sign in";

  return (
    <div className="flex h-screen bg-white text-neutral-900 font-sans overflow-hidden">
      <div className="relative hidden lg:flex flex-1 overflow-hidden bg-neutral-100">
        <div className="absolute inset-0 bg-neutral-900/10" />
        <div className="relative z-10 m-auto max-w-lg p-10">
          <div className="rounded-2xl bg-white p-6 shadow-lg ring-1 ring-black/5">
            <p className="text-sm text-neutral-500">Platform Pendidikan Inklusif</p>
            <p className="mt-1 text-xl font-semibold text-neutral-900">iBisa</p>
            <p className="mt-2 text-sm text-neutral-600">
              Mendampingi setiap langkah tumbuh kembang anak istimewa melalui pendekatan adaptif dan terpadu.
            </p>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-120 h-full overflow-y-auto">
        <div className="mx-auto flex min-h-full flex-col px-6 py-10 sm:px-8">
          <header className="mb-10 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 text-neutral-900 font-bold">
              <span>iBisa</span>
            </Link>
            <Link
              href={`/${nextVerb}`}
              className="text-sm text-neutral-600 hover:text-neutral-900"
            >
              {isLogin ? "Belum punya akun?" : "Sudah punya akun?"}{" "}
              <span className="font-medium text-blue-700">{nextLabel}</span>
            </Link>
          </header>

          <main className="flex-1 flex flex-col justify-center">
            <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">{title}</h1>
            {subtitle ? (
              <p className="mt-1 text-sm text-neutral-500">{subtitle}</p>
            ) : null}

            <div className="mt-8 w-full max-w-md">
              {children}
            </div>
          </main>

          <footer className="mt-10 flex items-center justify-between text-sm text-neutral-500">
            <Link href="/" className="hover:text-neutral-900">iBisa.id</Link>
            <span>iBisa © {new Date().getFullYear()}</span>
          </footer>
        </div>
      </div>
    </div>
  );
}

export default AuthSplit;
