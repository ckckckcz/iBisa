'use client';

import { useState } from 'react';
import { getToken } from '@/lib/ai-helpers';
import type { ApprovalQuestion, ChatMsg } from '@/types/ai';

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000';

export type UseChatOptions = {
  onMessageSent: (sid: string, messages: ChatMsg[], firstText?: string) => void;
  getActiveId: () => string | null;
  setActiveId: (id: string) => void;
};

export function useChat({ onMessageSent, getActiveId, setActiveId }: UseChatOptions) {
  const [chat, setChat] = useState<ChatMsg[]>([]);
  const [thinking, setThinking] = useState(false);
  const [streaming, setStreaming] = useState('');
  const [activeQuery, setActiveQuery] = useState('');
  const [error, setError] = useState('');

  async function send(text: string): Promise<void> {
    if (!text.trim()) return;
    setError('');
    const currentActiveId = getActiveId();
    const sid = currentActiveId ?? crypto.randomUUID();
    if (!currentActiveId) setActiveId(sid);
    const next: ChatMsg[] = [...chat, { role: 'user', content: text }];
    setChat(next);
    onMessageSent(sid, next, text);
    setActiveQuery(text);
    setThinking(true);
    setStreaming('');
    const res = await fetch(`${apiUrl}/school/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify({ messages: next.map(({ role, content }) => ({ role, content })) }),
    });
    const data = await res.json();
    setThinking(false);
    if (!data.success) { setError(data.message); return; }
    const reply = data.data.content as string;
    const questions = data.data.questions as ApprovalQuestion[] | undefined;
    const thoughts = data.data.thoughts as string[] | undefined;
    setStreaming(questions?.length ? '' : reply);
    const full: ChatMsg[] = [...next, { role: 'assistant', content: reply, questions, thoughts }];
    setChat(full);
    onMessageSent(sid, full);
  }

  function reset(): void {
    setActiveQuery('');
    setStreaming('');
    setThinking(false);
    setError('');
  }

  return { chat, setChat, thinking, streaming, activeQuery, error, setError, send, reset };
}
