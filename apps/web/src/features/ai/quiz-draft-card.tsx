'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { getValidToken } from '@/lib/ai-helpers';
import { dataClear } from '@/lib/data-cache';
import type { QuizDraftQuestion } from '@/types/ai';

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000';
const LETTERS = ['A', 'B', 'C', 'D'] as const;

function clone(draft: QuizDraftQuestion[]): QuizDraftQuestion[] {
  return structuredClone(draft) as QuizDraftQuestion[];
}
const emptyQuestion = (): QuizDraftQuestion => ({
  question: '',
  options: ['', '', '', ''] as QuizDraftQuestion['options'],
  answerIndex: 0,
  explanation: '',
});

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
  const [items, setItems] = useState<QuizDraftQuestion[]>(() => clone(draft));

  function upd(i: number, patch: Partial<QuizDraftQuestion>) {
    setItems((prev) => prev.map((q, idx) => (idx === i ? { ...q, ...patch } : q)));
  }
  function updOpt(i: number, oi: number, val: string) {
    setItems((prev) => prev.map((q, idx) => (idx === i ? { ...q, options: q.options.map((o, j) => (j === oi ? val : o)) as QuizDraftQuestion['options'] } : q)));
  }

  async function save() {
    if (!title.trim()) { setError('Isi judul kuis dulu.'); return; }
    if (!items.length) { setError('Minimal 1 soal.'); return; }
    for (let i = 0; i < items.length; i++) {
      const q = items[i];
      if (!q.question.trim()) { setError(`Soal ${i + 1} belum ada pertanyaan.`); return; }
      if (q.options.some((o) => !o.trim())) { setError(`Soal ${i + 1} opsi masih kosong.`); return; }
    }
    setError('');
    setSaving(true);
    try {
      const res = await fetch(`${apiUrl}/quizzes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${await getValidToken()}` },
        body: JSON.stringify({ title: title.trim(), subject, questions: items }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message ?? 'Gagal menyimpan.');
      if (!data.data?.code) throw new Error('Server tidak mengembalikan kode kuis.');
      dataClear('quizzes:all');
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
    } catch {}
  }

  if (savedCode) {
    return (
      <div className="mt-3 overflow-hidden rounded-lg border border-neutral-200 bg-white">
        <div className="border-b border-neutral-200 px-3 py-2.5">
          <p className="text-sm font-medium text-neutral-900">Preview soal</p>
          <p className="text-xs text-neutral-500">{items.length} soal — tersimpan</p>
        </div>
        <ol className="divide-y divide-neutral-100">
          {items.map((q, i) => (
            <li key={i} className="px-3 py-3">
              <p className="text-sm font-medium leading-snug text-neutral-900">{i + 1}. {q.question}</p>
              <ul className="mt-2 grid gap-1.5 sm:grid-cols-2">
                {q.options.map((o, oi) => (
                  <li key={oi} className={`rounded border px-2.5 py-1.5 text-xs ${oi === q.answerIndex ? 'border-neutral-900 bg-neutral-900 text-white' : 'border-neutral-200 bg-neutral-50 text-neutral-700'}`}>
                    <span className="font-mono font-semibold">{LETTERS[oi]}.</span> {o}
                  </li>
                ))}
              </ul>
              {!!q.explanation && <p className="mt-2 border-l-2 border-neutral-200 pl-2.5 text-xs leading-relaxed text-neutral-500">{q.explanation}</p>}
            </li>
          ))}
        </ol>
        <div className="border-t border-neutral-200 bg-neutral-50 px-3 py-3 text-center">
          <p className="text-xs text-neutral-600">Kode untuk murid</p>
          <div className="mt-1 flex items-center justify-center gap-2">
            <span className="rounded border border-neutral-300 bg-white px-3 py-1.5 font-mono text-base font-bold tracking-widest text-neutral-900">{savedCode}</span>
            <Button size="sm" variant="outline" onClick={copy}>{copied ? 'Tersalin' : 'Salin'}</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-3 overflow-hidden rounded-lg border border-neutral-200 bg-white">
      <div className="flex items-baseline justify-between border-b border-neutral-200 px-3 py-2.5">
        <div>
          <p className="text-sm font-medium text-neutral-900">Draft soal — {items.length} butir</p>
          <p className="text-xs text-neutral-500">Periksa, edit jawaban & pembahasan, lalu simpan.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setItems((p) => [...p, emptyQuestion()])} className="h-7 text-xs">
          + Tambah soal
        </Button>
      </div>

      <div className="divide-y divide-neutral-100">
        {items.map((q, i) => (
          <div key={i} className="px-3 py-4 sm:px-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-neutral-500">Soal {i + 1}</span>
              <button type="button" onClick={() => setItems((p) => p.filter((_, idx) => idx !== i))} className="text-xs text-neutral-400 hover:text-red-600">
                Hapus
              </button>
            </div>

            <textarea
              value={q.question}
              onChange={(e) => upd(i, { question: e.target.value })}
              rows={2}
              placeholder="Tulis pertanyaan…"
              className="mt-2 min-h-12 w-full resize-y rounded-md border border-neutral-200 bg-white px-2.5 py-2 text-sm leading-relaxed outline-none placeholder:text-neutral-400 focus:border-neutral-400 focus:ring-1 focus:ring-neutral-200"
            />

            <div className="mt-3">
              <p className="text-xs font-medium text-neutral-700">Jawaban</p>
              <p className="text-[11px] text-neutral-400">Pilih lingkaran untuk kunci jawaban. Semua opsi bisa diedit.</p>
              <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
                {q.options.map((o, oi) => {
                  const active = oi === q.answerIndex;
                  return (
                    <label
                      key={oi}
                      className={`flex cursor-pointer items-center gap-2 rounded-md border px-2.5 py-2 ${active ? 'border-neutral-900 bg-neutral-50' : 'border-neutral-200 bg-white hover:bg-neutral-50'}`}
                    >
                      <input
                        type="radio"
                        name={`kunci-${i}`}
                        checked={active}
                        onChange={() => upd(i, { answerIndex: oi })}
                        className="h-3.5 w-3.5 accent-neutral-900"
                      />
                      <span className="font-mono text-xs font-semibold text-neutral-500">{LETTERS[oi]}.</span>
                      <input
                        value={o}
                        onChange={(e) => updOpt(i, oi, e.target.value)}
                        placeholder={`Opsi ${LETTERS[oi]}`}
                        className="w-full bg-transparent text-sm outline-none placeholder:text-neutral-400"
                      />
                      {o && (
                        <button
                          type="button"
                          onClick={(e) => { e.preventDefault(); updOpt(i, oi, ''); }}
                          className="shrink-0 px-1 text-xs text-neutral-300 hover:text-neutral-600"
                          title="Kosongkan"
                        >
                          ×
                        </button>
                      )}
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="mt-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-neutral-700">Pembahasan <span className="font-normal text-neutral-400">(opsional)</span></p>
                {q.explanation && (
                  <button type="button" onClick={() => upd(i, { explanation: '' })} className="text-xs text-neutral-400 hover:text-red-600">
                    Hapus pembahasan
                  </button>
                )}
              </div>
              <textarea
                value={q.explanation}
                onChange={(e) => upd(i, { explanation: e.target.value })}
                rows={2}
                placeholder="Tulis alasan jawaban benar…"
                className="mt-1.5 min-h-12 w-full resize-y rounded-md border border-neutral-200 bg-neutral-50 px-2.5 py-2 text-xs leading-relaxed outline-none placeholder:text-neutral-400 focus:border-neutral-300 focus:bg-white"
              />
            </div>
          </div>
        ))}
      </div>

      {items.length === 0 && (
        <div className="border-t border-dashed border-neutral-200 px-4 py-8 text-center">
          <p className="text-sm text-neutral-600">Belum ada soal</p>
          <p className="text-xs text-neutral-400">Klik “Tambah soal” atau generate ulang dengan /soal.</p>
        </div>
      )}

      <div className="rounded-b-lg border-t border-neutral-200 bg-neutral-50 px-3 py-4 sm:px-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="min-w-0 flex-1">
            <span className="mb-1.5 block text-xs font-medium text-neutral-600">Judul kuis <span className="text-red-500">*</span></span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: IPA — Daur Hidup Kupu-kupu"
              maxLength={80}
              className="h-9 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm outline-none placeholder:text-neutral-400 focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900/10"
            />
          </label>
          <label className="w-full sm:w-36">
            <span className="mb-1.5 block text-xs font-medium text-neutral-600">Mapel</span>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="IPA"
              maxLength={40}
              className="h-9 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm outline-none placeholder:text-neutral-400 focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900/10"
            />
          </label>
          <Button onClick={save} disabled={saving || !items.length} className="h-9 shrink-0 rounded-md bg-neutral-900 px-5 text-sm font-medium text-white hover:bg-neutral-800 w-full sm:w-auto">
            {saving ? 'Menyimpan…' : `Simpan ${items.length} soal`}
          </Button>
        </div>
        {error && <p role="alert" className="mt-2 rounded-md bg-red-50 px-2.5 py-2 text-xs text-red-600 ring-1 ring-red-200">{error}</p>}
        <p className="mt-2 text-center text-[11px] text-neutral-400 sm:text-left">Judul wajib diisi. Pembahasan & jawaban sudah bisa diedit di atas.</p>
      </div>
    </div>
  );
}
