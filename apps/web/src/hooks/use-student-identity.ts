"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";

export const NICKNAME_KEY = "bisa-quiz-nickname";
const FALLBACK_NAME = "Pemain";
const MAX_NAME_LENGTH = 20;

function readManualNickname(): string {
  if (typeof window === "undefined") return FALLBACK_NAME;
  try {
    return localStorage.getItem(NICKNAME_KEY)?.trim() || FALLBACK_NAME;
  } catch {
    return FALLBACK_NAME;
  }
}

export type StudentIdentity = {
  name: string;
  avatarUrl: string | null;
  isLoggedIn: boolean;
};

export function useStudentIdentity() {
  const { profile } = useAuth();
  const [manualName, setManualName] = useState(readManualNickname);

  function saveManualName(name: string) {
    const clean = name.slice(0, MAX_NAME_LENGTH);
    setManualName(clean.trim() || FALLBACK_NAME);
    try {
      localStorage.setItem(NICKNAME_KEY, clean);
    } catch {}
  }

  const identity: StudentIdentity =
    profile?.full_name.trim()
      ? { name: profile.full_name.trim(), avatarUrl: profile.avatar_url ?? null, isLoggedIn: true }
      : { name: manualName, avatarUrl: null, isLoggedIn: false };

  return { identity, manualName, saveManualName };
}
