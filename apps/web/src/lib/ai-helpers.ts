export function isGreeting(q: string): boolean {
  const s = q.trim().toLowerCase();
  if (s.length < 4) return true;
  return /^(halo|hallo|hai|hi|hello|pagi|siang|sore|malam|assalamu'alaikum|assalamualaikum|test|tes|ok|oke|makasih|terima kasih)[.!,\s]*$/.test(s);
}

export function stepsFor(q: string): string[] | undefined {
  const s = q.toLowerCase();
  if (s.includes('jadwal') || s.includes('piket')) return ['Memahami permintaan jadwal', 'Menyusun pembagian tugas'];
  if (s.includes('materi') || s.includes('rangkum') || s.includes('pecahan')) return ['Meringkas materi', 'Menyusun penjelasan untuk siswa'];
  if (s.includes('surat') || s.includes('undangan') || s.includes('draf') || s.includes('draft')) return ['Memahami format surat', 'Menyusun draf'];
  if (s.includes('literasi') || s.includes('ide') || s.includes('kegiatan')) return ['Mencari ide kegiatan', 'Menyusun usulan'];
  return undefined;
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
