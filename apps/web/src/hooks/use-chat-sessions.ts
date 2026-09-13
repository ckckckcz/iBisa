'use client';

import { useState } from 'react';
import { SESSIONS_KEY, MAX_SESSIONS, TITLE_MAX_LEN } from '@/lib/constants';
import { stripAttachments } from '@/lib/attachments';
import type { Session, ChatMsg } from '@/types/ai';

function loadSessions(): Session[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = JSON.parse(localStorage.getItem(SESSIONS_KEY) ?? '[]');
    return Array.isArray(raw) ? raw : [];
  } catch { return []; }
}

function saveSessions(sessions: Session[]): void {
  try { localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions)); } catch { /* skip */ }
}

export function useChatSessions() {
  const [sessions, setSessions] = useState<Session[]>(loadSessions);
  const [activeId, setActiveId] = useState<string | null>(null);

  function persist(next: Session[]): void {
    setSessions(next);
    saveSessions(next);
  }

  function persistSessions(sid: string, messages: ChatMsg[], firstText?: string): void {
    const prev = loadSessions();
    const found = prev.find((s) => s.id === sid);
    const title = (found?.title ?? (firstText ?? messages.find((m) => m.role === 'user')?.content ?? 'Chat baru')).slice(0, TITLE_MAX_LEN);
    const rest = prev.filter((s) => s.id !== sid);
    persist([{ id: sid, title, messages: messages.map(stripAttachments) }, ...rest].slice(0, MAX_SESSIONS));
  }

  function newChat(): void {
    setActiveId(null);
  }

  function pickSession(id: string): Session | undefined {
    return loadSessions().find((x) => x.id === id);
  }

  function deleteSession(id: string): void {
    persist(loadSessions().filter((s) => s.id !== id));
  }

  return { sessions, activeId, setActiveId, persistSessions, newChat, pickSession, deleteSession };
}
