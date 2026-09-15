'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { getToken } from '@/lib/ai-helpers';
import type { QuizDraftQuestion } from '@/types/ai';

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000';
const LETTERS = ['A', 'B', 'C', 'D'];

export default function QuizDraftCard({
  draft,
  savedCode,
  onSaved,
}: {
  draft: QuizDraftQuestion[];
  savedCode?: string;
  onSaved: (code: string) => void;
}) {
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  async function save() {
    if (!title.trim()) {
      setError('Isi judul kuis dulu.');
      return;
    }
    setError('');
    setSaving(true);
    try {
      const res = await fetch(`${apiUrl}/quizzes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ title: title.trim(), subject, questions: draft }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message ?? 'Gagal menyimpan.');
      if (!data.data?.code) throw new Error('Server tidak mengembalikan kode kuis.');
      onSaved(data.data.code as string);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal menyimpan.');
    } finally {
      setSaving(false);
    }
  }

  async function copy() {
    if (!savedCode) return;
    try {
      await navigator.clipboard.writeText(savedCode);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      /* abaikan */
    }
  }

  return (
    <div className="mt-2 rounded-lg border border-neutral-200 bg-white p-3">
      <ol className="flex flex-col gap-2.5">
        {draft.map((q, i) => (
          <li key={i} className="rounded-lg bg-neutral-50 p-2.5 text-sm">
            <p className="font-semibold">{i + 1}. {q.question}</p>
            <ul className="mt-1 grid gap-1 sm:grid-cols-2">
              {q.options.map((o, oi) => (
                <li key={oi} className={`rounded px-2 py-1 text-xs ${oi === q.answerIndex ? 'bg-emerald-100 font-bold text-emerald-800' : 'text-neutral-600 ring-1 ring-neutral-200'}`}>
                  {LETTERS[oi]}. {o}
                </li>
              ))}
            </ul>
            {!!q.explanation && <p className="mt-1 text-xs text-neutral-500">{q.explanation}</p>}
          </li>
        ))}
      </ol>

      {savedCode ? (
        <div role="status" className="mt-3 rounded-lg bg-emerald-50 p-3 text-center ring-1 ring-emerald-200">
          <p className="text-xs font-semibold text-emerald-800">Tersimpan! Kode untuk murid:</p>
          <div className="mt-1 flex items-center justify-center gap-2">
            <span className="text-2xl font-extrabold tracking-[0.25em] text-emerald-900">{savedCode}</span>
            <Button size="sm" variant="outline" onClick={copy}>{copied ? 'Tersalin!' : 'Salin'}</Button>
          </div>
        </div>
      ) : (
        <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Judul kuis" maxLength={80} aria-label="Judul kuis" className="block rounded-lg border border-neutral-300 px-3 py-2 text-sm" />
          <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Mapel (opsional)" maxLength={40} aria-label="Mapel" className="block rounded-lg border border-neutral-300 px-3 py-2 text-sm" />
          <Button onClick={save} disabled={saving}>{saving ? 'Menyimpan…' : 'Simpan kuis'}</Button>
        </div>
      )}
      {error && <p role="alert" className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}
