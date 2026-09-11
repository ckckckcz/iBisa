"use client";

import { useEffect, useState } from "react";

type Profile = { id: string; email: string; full_name: string; role: string; school_id: string | null };

export function useAuth() {
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("profile");
      if (raw) setProfile(JSON.parse(raw) as Profile);
    } catch {}
  }, []);

  return { profile };
}
