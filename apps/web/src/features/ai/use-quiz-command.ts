'use client';

import { useState } from 'react';
import { getValidToken } from '@/lib/ai-helpers';
import type { Attachment, ChatMsg, QuizDraftQuestion } from '@/types/ai';
import type { DbQuiz } from '@/lib/quizzes';

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000';

const USAGE =
  'Pakai: /soal [jumlah] + lampirkan file materi. Contoh: /soal 5 (lalu lampirkan PDF). Jumlah default 5, maks 10.\nTip revisi di chat: ketik /soal @855207 tambahkan soal dari materi ini — ketik @ untuk cari kuis.';

function parseCount(text: string): number {
  const noAt = text.replace(/@\S+/g, " ");
  let m = noAt.match(/\/soal\s+(\d+)/i);
  if (m) return Math.min(Math.max(parseInt(m[1], 10), 1), 10);
  m = noAt.match(/(\d+)\s*soal/i);
  if (m) return Math.min(Math.max(parseInt(m[1], 10), 1), 10);
  return 5;
}

function toDraft(q: DbQuiz): QuizDraftQuestion[] {
  return q.questions.map((qq) => ({
    question: qq.question,
    options: [...qq.options] as [string, string, string, string],
    answerIndex: qq.answerIndex,
    explanation: qq.explanation ?? "",
  }));
}

function findMention(text: string, quizzes: DbQuiz[]): DbQuiz | null {
  const atCodes = [...text.matchAll(/@([A-Za-z0-9_-]+)/g)].map((m) => m[1].toLowerCase());
  if (!atCodes.length) return null;
  for (const c of atCodes) {
    const hit = quizzes.find((q) => q.code.toLowerCase() === c || q.title.toLowerCase().replace(/\s+/g, '').includes(c));
    if (hit) return hit;
  }
  return null;
}

function formatQuizForPrompt(q: DbQuiz): string {
  const lines = q.questions.map((qq, i) => `${i + 1}. ${qq.question}\n   A. ${qq.options[0]}\n   B. ${qq.options[1]}\n   C. ${qq.options[2]}\n   D. ${qq.options[3]}\n   Kunci: ${['A', 'B', 'C', 'D'][qq.answerIndex]} — ${qq.explanation || '-'}`).join('\n\n');
  return `Kuis untuk direvisi (kode ${q.code} — ${q.title} | ${q.subject || 'Umum'}):\n${lines}`;
}

async function postGenerate(files: Attachment[], count: number, mention: DbQuiz | null): Promise<QuizDraftQuestion[]> {
  const isRevisi = !!mention;
  const revisiBlock = mention ? `${formatQuizForPrompt(mention)}\n\n` : '';
  const instruction = isRevisi
    ? `${revisiBlock}Revisi soal di atas berdasarkan materi terlampir. Perbaiki yang janggal, pertahankan yang sudah bagus, dan buatkan ${count} soal baru yang selaras (jika materi menambah konteks).`
    : `Buatkan ${count} soal pilihan ganda dari materi terlampir.`;

  const res = await fetch(`${apiUrl}/quizzes/ai/generate-quiz`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${await getValidToken()}` },
    body: JSON.stringify({
      count,
      subject: mention?.subject ?? '',
      messages: [{ role: 'user', content: instruction, attachments: files }],
    }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message ?? 'Gagal generate soal.');
  const questions = data.data?.questions;
  if (!Array.isArray(questions) || !questions.length) throw new Error('AI tidak mengembalikan soal valid.');
  return questions as QuizDraftQuestion[];
}

export type QuizPush = (msgs: ChatMsg[]) => void;

export function useQuizCommand({ enabled, quizzes = [] }: { enabled: boolean; quizzes?: DbQuiz[] }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function tryHandle(text: string, files: Attachment[] | undefined, push: QuizPush): Promise<boolean> {
    const clean = text.trim();
    if (!enabled || !clean.toLowerCase().startsWith('/soal')) return false;
    const effectiveMention = findMention(clean, quizzes);
    const hasContext = !!files?.length || !!effectiveMention;
    if (!hasContext) {
      push([
        { role: 'user', content: clean },
        { role: 'assistant', content: USAGE },
      ]);
      return true;
    }
    let count = parseCount(clean);
    if (!clean.match(/\d+\s*soal/i) && /tambah/i.test(clean) && !/\/soal\s+\d+/i.test(clean)) count = 1;
    const isTambah = /tambah/i.test(clean);
    setBusy(true);
    setError('');
    const alreadyTagged = effectiveMention ? clean.toLowerCase().includes(`@${effectiveMention.code.toLowerCase()}`) : false;
    const label = effectiveMention && !alreadyTagged ? `${clean}  @${effectiveMention.code}` : clean;
    push([{ role: 'user', content: label, attachments: files }]);
    try {
      const newDraft = await postGenerate(files ?? [], count, effectiveMention ?? null);
      let draft = effectiveMention && isTambah ? [...toDraft(effectiveMention), ...newDraft] : newDraft;
      if (draft.length > 20) draft = draft.slice(0, 20);
      const msg = effectiveMention
        ? isTambah
          ? `Nambah jadi ${draft.length} soal (${Math.min(effectiveMention.questions.length, draft.length - newDraft.length)} lama + ${newDraft.length} baru dari @${effectiveMention.code}). Periksa & simpan sebagai kuis baru.`
          : `Revisi jadi! ${draft.length} soal (basis ${effectiveMention.code} — ${effectiveMention.title}). Periksa & simpan.`
        : `Jadi! ${draft.length} soal dari materimu. Periksa, isi judul, lalu simpan.`;
      push([{ role: 'assistant', content: msg, quizDraft: draft }]);
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
