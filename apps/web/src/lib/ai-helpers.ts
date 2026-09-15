export function isGreeting(q: string): boolean {
  const s = q.trim().toLowerCase();
  if (s.length < 4) return true;
  return /^(halo|hallo|hai|hi|hello|pagi|siang|sore|malam|assalamu'alaikum|assalamualaikum|test|tes|ok|oke|makasih|terima kasih)[.!,\s]*$/.test(s);
}

export function followUpsFor(q: string): string[] {
  if (!q || isGreeting(q)) return [];
  const s = q.toLowerCase();
  if (s.includes('jadwal') || s.includes('piket')) return ['Ubah ke format tabel harian', 'Tambahkan pembagian tugas cadangan'];
  if (s.includes('materi') || s.includes('rangkum')) return ['Buatkan kuis singkat dari materi ini', 'Sederhanakan untuk kelas bawah'];
  if (s.includes('surat') || s.includes('undangan')) return ['Buatkan versi formal kop sekolah', 'Buatkan versi WA singkat'];
  return ['Jelaskan lebih detail', 'Buatkan versi singkat'];
}

function cookieGet(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined;
  const found = document.cookie.split('; ').find((c) => c.startsWith(name + '='));
  if (!found) return undefined;
  try {
    return decodeURIComponent(found.split('=').slice(1).join('='));
  } catch {
    return found.split('=').slice(1).join('=');
  }
}

export function getToken(): string {
  if (typeof document === 'undefined') return '';
  return cookieGet('token') ?? localStorage.getItem('token') ?? '';
}

function getRefreshToken(): string {
  if (typeof document === 'undefined') return '';
  return cookieGet('refresh_token') ?? localStorage.getItem('refresh_token') ?? '';
}

function decodeExp(token: string): number | null {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    const b64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const pad = b64.length % 4 ? '='.repeat(4 - (b64.length % 4)) : '';
    const json = atob(b64 + pad);
    const obj = JSON.parse(json) as { exp?: number };
    return typeof obj.exp === 'number' ? obj.exp : null;
  } catch {
    return null;
  }
}

let refreshPromise: Promise<string> | null = null;

export async function getValidToken(): Promise<string> {
  const token = getToken();
  if (!token) return '';
  const exp = decodeExp(token);
  if (exp === null || exp * 1000 - Date.now() > 5 * 60 * 1000) return token;

  const rt = getRefreshToken();
  if (!rt) return token;

  if (refreshPromise) return refreshPromise;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000';
  refreshPromise = (async () => {
    try {
      const res = await fetch(`${apiUrl}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: rt }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.success || !data?.token) throw new Error(data?.message ?? 'Refresh failed');
      const maxAge = 604800;
      const enc = (v: string) => encodeURIComponent(v);
      document.cookie = `token=${enc(data.token)}; path=/; max-age=${maxAge}; SameSite=Lax`;
      if (data.refresh_token) {
        document.cookie = `refresh_token=${enc(data.refresh_token)}; path=/; max-age=${maxAge}; SameSite=Lax`;
        try { localStorage.setItem('refresh_token', data.refresh_token); } catch {}
        if (data.expires_at) try { localStorage.setItem('expires_at', String(data.expires_at)); } catch {}
      }
      try { localStorage.setItem('token', data.token); } catch {}
      if (data.profile) try { localStorage.setItem('profile', JSON.stringify(data.profile)); } catch {}
      return data.token as string;
    } catch {
      return token;
    } finally {
      refreshPromise = null;
    }
  })();
  return refreshPromise;
}


