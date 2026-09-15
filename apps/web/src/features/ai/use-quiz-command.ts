'use client';

import { useState } from 'react';
import { getToken } from '@/lib/ai-helpers';
import type { Attachment, ChatMsg, QuizDraftQuestion } from '@/types/ai';

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000';

const USAGE =
  'Pakai: /soal [jumlah] + lampirkan file materi. Contoh: /soal 5 (lalu lampirkan PDF). Jumlah default 5, maks 10.';

function parseCount(text: string): number {
  const m = text.match(/\/soal\s+(\d+)/i);
  const n = m ? parseInt(m[1], 10) : 5;
  return Math.min(Math.max(n || 5, 1), 10);
}

async function postGenerate(files: Attachment[], count: number): Promise<QuizDraftQuestion[]> {
  const res = await fetch(`${apiUrl}/quizzes/ai/generate-quiz`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
    body: JSON.stringify({
      count,
      subject: '',
      messages: [{ role: 'user', content: `Buatkan ${count} soal pilihan ganda dari materi terlampir.`, attachments: files }],
    }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message ?? 'Gagal generate soal.');
  const questions = data.data?.questions;
  if (!Array.isArray(questions) || !questions.length) throw new Error('AI tidak mengembalikan soal valid.');
  return questions as QuizDraftQuestion[];
}

export type QuizPush = (msgs: ChatMsg[]) => void;

export function useQuizCommand({ enabled }: { enabled: boolean }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function tryHandle(text: string, files: Attachment[] | undefined, push: QuizPush): Promise<boolean> {
    const clean = text.trim();
    if (!enabled || !clean.toLowerCase().startsWith('/soal')) return false;
    if (!files?.length) {
      push([
        { role: 'user', content: clean },
        { role: 'assistant', content: USAGE },
      ]);
      return true;
    }
    const count = parseCount(clean);
    setBusy(true);
    setError('');
    push([{ role: 'user', content: clean, attachments: files }]);
    try {
      const draft = await postGenerate(files, count);
      push([{ role: 'assistant', content: `Jadi! ${draft.length} soal dari materimu. Periksa, isi judul, lalu simpan.`, quizDraft: draft }]);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Gagal generate soal.';
      setError(msg);
      push([{ role: 'assistant', content: `Gagal membuat soal: ${msg}` }]);
    } finally {
      setBusy(false);
    }
    return true;
  }

  return { tryHandle, busy, error };
}
