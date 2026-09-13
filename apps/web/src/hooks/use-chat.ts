'use client';

import { useEffect, useRef, useState } from 'react';
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
  const [queued, setQueued] = useState(0);
  const [error, setError] = useState('');

  const busyRef = useRef(false);
  const pendingRef = useRef(0);
  const chatRef = useRef<ChatMsg[]>([]);
  useEffect(() => { chatRef.current = chat; }, [chat]);

  async function pump(sid: string): Promise<void> {
    if (busyRef.current) return;
    busyRef.current = true;
    try {
      while (pendingRef.current > 0) {
        const history = chatRef.current;
        const lastUser = [...history].reverse().find((m) => m.role === 'user');
        setActiveQuery(lastUser?.content ?? '');
        setThinking(true);
        setStreaming('');
        const res = await fetch(`${apiUrl}/school/ai/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
          body: JSON.stringify({ messages: history.map(({ role, content }) => ({ role, content })) }),
        });
        const data = await res.json();
        if (!data.success) {
          setError(data.message);
          pendingRef.current = 0;
          setQueued(0);
          break;
        }
        const reply = data.data.content as string;
        const questions = data.data.questions as ApprovalQuestion[] | undefined;
        const thoughts = data.data.thoughts as string[] | undefined;
        setStreaming(questions?.length ? '' : reply);
        const full: ChatMsg[] = [...chatRef.current, { role: 'assistant', content: reply, questions, thoughts }];
        chatRef.current = full;
        setChat(full);
        onMessageSent(sid, full);
        pendingRef.current -= 1;
        setQueued((c) => Math.max(0, c - 1));
      }
    } finally {
      busyRef.current = false;
      setThinking(false);
    }
  }

  async function send(text: string): Promise<void> {
    const clean = text.trim();
    if (!clean) return;
    setError('');
    const currentActiveId = getActiveId();
    const sid = currentActiveId ?? crypto.randomUUID();
    if (!currentActiveId) setActiveId(sid);
    const next: ChatMsg[] = [...chatRef.current, { role: 'user', content: clean }];
    chatRef.current = next;
    setChat(next);
    onMessageSent(sid, next, clean);
    pendingRef.current += 1;
    setQueued((c) => c + 1);
    void pump(sid);
  }

  function reset(): void {
    setActiveQuery('');
    setStreaming('');
    setThinking(false);
    setError('');
    pendingRef.current = 0;
    setQueued(0);
  }

  return { chat, setChat, thinking, streaming, activeQuery, queued, error, setError, send, reset };
}
