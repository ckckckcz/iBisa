"use client";

import { useEffect, useState } from "react";

type Profile = { id: string; email: string; full_name: string; role: string; school_id: string | null };

export function useAuth() {
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const raw = localStorage.getItem("profile");
        if (raw) {
          setProfile(JSON.parse(raw) as Profile);
          return;
        }
      } catch {}
      try {
        const token = document.cookie.split("; ").find((c) => c.startsWith("token="))?.split("=")[1];
        if (!token) return;
        const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";
        const res = await fetch(`${apiUrl}/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) return;
        const data = await res.json();
        if (data.profile) {
          setProfile(data.profile as Profile);
          localStorage.setItem("profile", JSON.stringify(data.profile));
        }
      } catch {}
    };
    load();
    const handler = () => {
      try {
        const raw = localStorage.getItem("profile");
        setProfile(raw ? (JSON.parse(raw) as Profile) : null);
      } catch {
        setProfile(null);
      }
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  return { profile };
}
