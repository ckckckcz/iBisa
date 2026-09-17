"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Add01Icon,
  ArrowRight01Icon,
  BookOpen01Icon,
  Search01Icon,
  Copy01Icon,
  Tick02Icon,
  Idea01Icon,
} from "@hugeicons/core-free-icons";
import { Input } from "@/components/ui/input";
import { fetchTeacherQuizzes, type DbQuiz } from "@/lib/quizzes";
import { getValidToken } from "@/lib/ai-helpers";
import { useAuth } from "@/hooks/use-auth";

function fmtDate(s?: string) {
  if (!s) return "-";
  try {
    return new Date(s).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return s;
  }
}

export default function TeacherQuizzesPage() {
  const { profile } = useAuth();
  const myId = profile?.id ?? null;
  const [rows, setRows] = useState<DbQuiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      setError("");
      try {
        const token = await getValidToken();
        if (!token) {
          if (!cancelled) setError("Sesi habis, silakan login ulang.");
          return;
        }
        const data = await fetchTeacherQuizzes();
        if (!cancelled) setRows(data);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Gagal memuat soal.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const ownRows = useMemo(() => (myId ? rows.filter((r) => r.created_by === myId) : rows), [rows, myId]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return ownRows;
    return ownRows.filter((r) =>
      r.title.toLowerCase().includes(needle) ||
      r.code.toLowerCase().includes(needle) ||
      (r.subject ?? "").toLowerCase().includes(needle)
    );
  }, [ownRows, q]);

  const ownCount = ownRows.length;

  async function copyCode(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(code);
      window.setTimeout(() => setCopied((c) => (c === code ? null : c)), 1500);
    } catch {}
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 lg:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Daftar Soal</h1>
          <p className="text-sm text-muted-foreground">Soal pribadi yang kamu buat — bisa diedit — {ownCount} kuis</p>
        </div>
        <Link href="/teacher/ai" className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/80">
          <HugeiconsIcon icon={Add01Icon} size={14} /> Buat soal di Chat AI
        </Link>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="relative w-full sm:max-w-sm">
          <HugeiconsIcon icon={Search01Icon} size={16} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Cari judul / kode / mapel..." value={q} onChange={(e) => setQ(e.target.value)} className="pl-8" />
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-md border border-neutral-200 bg-white px-2.5 py-1.5 text-xs text-neutral-600">
          <HugeiconsIcon icon={BookOpen01Icon} size={12} /> {filtered.length} kuis
        </span>
      </div>

      {error && (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <p className="py-8 text-center text-sm text-muted-foreground">Memuat...</p>
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-neutral-300 bg-white px-6 py-10 text-center">
          <p className="text-sm font-medium text-neutral-700">Belum ada soal</p>
          <p className="mt-1 text-xs text-neutral-500">Buat pertama via <Link href="/teacher/ai" className="font-medium text-neutral-900 underline">/teacher/ai</Link> — ketik <span className="font-mono">/soal 5</span> + lampirkan materi, lalu Simpan.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((r) => (
            <div key={r.id} className="flex flex-col overflow-hidden rounded-lg border border-neutral-200 bg-white">
              <div className="border-b border-neutral-100 bg-neutral-50 px-3 py-2.5">
                <p className="line-clamp-2 text-sm font-medium leading-snug text-neutral-900" title={r.title}>{r.title}</p>
                <p className="mt-1 flex items-center gap-1.5 text-xs text-neutral-500">
                  <span>{r.subject?.trim() ? r.subject : "Umum"}</span>
                  <span className="text-neutral-300">/</span>
                  <span>{r.questions.length} soal</span>
                  <span className="text-neutral-300">/</span>
                  <span>{fmtDate(r.created_at)}</span>
                </p>
              </div>
              <div className="flex flex-1 flex-col gap-2 px-3 py-3">
<div className="flex flex-wrap items-center gap-1.5">
                    <span className="rounded bg-neutral-900 px-2 py-0.5 font-mono text-xs font-bold tracking-widest text-white">{r.code}</span>
                    <button type="button" onClick={() => copyCode(r.code)} className="inline-flex items-center gap-1 rounded border border-neutral-200 bg-white px-2 py-1 text-xs hover:bg-neutral-50">
                      <HugeiconsIcon icon={copied === r.code ? Tick02Icon : Copy01Icon} size={12} />
                      {copied === r.code ? "Tersalin" : "Salin kode"}
                    </button>
                  </div>
                  {r.original_by && r.original_by !== r.created_by && (
                    <span className="inline-flex items-center gap-1 text-[11px] text-neutral-500">
                      <HugeiconsIcon icon={Idea01Icon} size={12} /> Original by {r.original_by_name || "pembuat asli"}
                    </span>
                  )}
                <ul className="mt-1 space-y-1">
                  {r.questions.slice(0, 2).map((qq, idx) => (
                    <li key={idx} className="line-clamp-2 rounded bg-neutral-50 px-2 py-1.5 text-xs leading-snug text-neutral-600">
                      <span className="font-medium text-neutral-700">{idx + 1}.</span> {qq.question}
                    </li>
                  ))}
                  {r.questions.length > 2 && <li className="text-xs text-neutral-400">+{r.questions.length - 2} soal lagi</li>}
                </ul>
                <div className="mt-auto flex gap-2 pt-2">
                  <Link href={`/teacher/quizzes/${encodeURIComponent(r.code)}`} className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-input bg-background px-2.5 py-1.5 text-xs font-medium hover:bg-muted">
                    Lihat detail <HugeiconsIcon icon={ArrowRight01Icon} size={12} />
                  </Link>
                  <Link href="/teacher/ai" className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-secondary px-2.5 py-1.5 text-xs font-medium text-secondary-foreground hover:bg-secondary/80">
                    <HugeiconsIcon icon={Idea01Icon} size={12} /> Chat AI
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
