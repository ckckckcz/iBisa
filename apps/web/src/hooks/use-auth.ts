"use client";

import { useEffect, useState } from "react";

export type AuthProfile = {
  id: string;
  email: string;
  full_name: string;
  role: string;
  school_id: string | null;
  avatar_url: string | null;
};

const PROFILE_KEY = "profile";

function readCachedProfile(): AuthProfile | null {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw || raw === "null") return null;
    const parsed = JSON.parse(raw) as Partial<AuthProfile>;
    if (!parsed?.full_name) return null;
    return { ...parsed, avatar_url: parsed.avatar_url ?? null } as AuthProfile;
  } catch {
    return null;
  }
}

function readToken(): string | undefined {
  return document.cookie
    .split("; ")
    .find((c) => c.startsWith("token="))
    ?.split("=")[1];
}

async function fetchFreshProfile(token: string): Promise<AuthProfile | null> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";
    const res = await fetch(`${apiUrl}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return (data.profile as AuthProfile) ?? null;
  } catch {
    return null;
  }
}

export function useAuth() {
  const [profile, setProfile] = useState<AuthProfile | null>(() =>
    typeof window === "undefined" ? null : readCachedProfile()
  );

  useEffect(() => {
    let cancelled = false;
    const token = readToken();
    if (token) {
      void fetchFreshProfile(token).then((fresh) => {
        if (cancelled || !fresh?.full_name) return;
        setProfile({ ...fresh, avatar_url: fresh.avatar_url ?? null });
        try {
          localStorage.setItem(PROFILE_KEY, JSON.stringify(fresh));
        } catch {
          /* abaikan */
        }
      });
    }
    const onStorage = () => setProfile(readCachedProfile());
    window.addEventListener("storage", onStorage);
    return () => {
      cancelled = true;
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  return { profile };
}
