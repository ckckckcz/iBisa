export function isGreeting(q: string): boolean {
  const s = q.trim().toLowerCase();
  if (s.length < 4) return true;
  return /^(halo|hallo|hai|hi|hello|pagi|siang|sore|malam|assalamu'alaikum|assalamualaikum|test|tes|ok|oke|makasih|terima kasih)[.!,\s]*$/.test(s);
}

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function pick<T>(pool: T[], seed: string): T {
  return pool[hash(seed) % pool.length];
}

const OPENERS = ['Memahami pertanyaan', 'Mengenali maksud pertanyaan', 'Membaca konteks percakapan'];
const CLOSERS = ['Menyusun jawaban', 'Merapikan jawaban', 'Menyiapkan jawaban akhir'];

export function stepsFor(q: string): string[] | undefined {
  const s = q.toLowerCase();
  const middles: string[] | undefined =
    s.includes('jadwal') || s.includes('piket')
      ? ['Memahami permintaan jadwal', 'Menyusun pembagian tugas', 'Merapikan format tabel']
      : s.includes('materi') || s.includes('rangkum') || s.includes('pecahan')
        ? ['Meringkas materi', 'Menyusun penjelasan untuk siswa', 'Menyiapkan contoh sederhana']
        : s.includes('surat') || s.includes('undangan') || s.includes('draf') || s.includes('draft')
          ? ['Memahami format surat', 'Menyusun draf', 'Mengecek bahasa formal']
          : s.includes('literasi') || s.includes('ide') || s.includes('kegiatan')
            ? ['Mencari ide kegiatan', 'Menyusun usulan', 'Menyesuaikan durasi kegiatan']
            : undefined;
  const middle = middles ? pick(middles, q) : pick(['Menyiapkan konteks jawaban', 'Mencari informasi relevan', 'Menimbang sudut pandang'], q);
  return [pick(OPENERS, q + '#o'), middle, pick(CLOSERS, q + '#c')];
}

export function followUpsFor(q: string): string[] {
  if (!q || isGreeting(q)) return [];
  const s = q.toLowerCase();
  if (s.includes('jadwal') || s.includes('piket')) return ['Ubah ke format tabel harian', 'Tambahkan pembagian tugas cadangan'];
  if (s.includes('materi') || s.includes('rangkum')) return ['Buatkan kuis singkat dari materi ini', 'Sederhanakan untuk kelas bawah'];
  if (s.includes('surat') || s.includes('undangan')) return ['Buatkan versi formal kop sekolah', 'Buatkan versi WA singkat'];
  return ['Jelaskan lebih detail', 'Buatkan versi singkat'];
}

export function getToken(): string {
  if (typeof document === 'undefined') return '';
  return document.cookie.split('; ').find((c) => c.startsWith('token='))?.split('=')[1] ?? localStorage.getItem('token') ?? '';
}
