import {
  ArrowLeftRightIcon,
  Comment01Icon,
  Edit02Icon,
  GithubIcon,
  YoutubeIcon,
} from "@hugeicons/core-free-icons";
import { FooterLink, FooterSocialLink, NavLink } from "./types";
import type { ModelItem, ThinkingRow } from "@/types/ai";

export const NAV_LINKS: readonly NavLink[] = [
  { label: "Tentang Kami", href: "#tentang-kami" },
  { label: "Layanan", href: "#layanan" },
  { label: "Testimoni", href: "#testimoni" },
  { label: "Daftar", href: "/register" },
];

export const FOOTER_COMPANY: readonly FooterLink[] = [
  { title: "Tentang Kami", href: "#tentang-kami" },
  { title: "Testimoni", href: "#testimoni" },
  { title: "Kebijakan Privasi", href: "#" },
] as const;

export const FOOTER_RESOURCES: readonly FooterLink[] = [
  { title: "Pusat Bantuan", href: "#" },
] as const;

export const FOOTER_SOCIAL: readonly FooterSocialLink[] = [
  { icon: YoutubeIcon, href: "#", label: "YouTube" },
  { icon: GithubIcon, href: "#", label: "GitHub" },
] as const;

// ── AI ────────────────────────────────────────────────────────────────────────

export const AI_MODELS: ModelItem[] = [
  { key: 'gemini-3.6-flash', name: 'gemini-3.6-flash', tag: 'AI' },
];

export const SESSIONS_KEY = 'bisa-ai-sessions';
export const MAX_SESSIONS = 30;
export const TITLE_MAX_LEN = 42;

export const AI_CHAT_EXAMPLES = [
  "Buatkan jadwal piket kelas 5 minggu ini",
  "Rangkum materi pecahan untuk siswa kelas 4",
  "Buatkan draft surat undangan rapat orang tua",
  "Beri ide kegiatan literasi 15 menit sebelum pelajaran",
];

export const CHAT_SIDEBAR_ANIMATION = {
  DURATION: 280,
  EASING: "cubic-bezier(0.16, 1, 0.3, 1)",
};

export const APPROVAL_CARD_ANIMATION = {
  SLIDE: "360ms cubic-bezier(0.22, 1, 0.36, 1)",
};

export const STREAMING_TIMING = {
  WORD_MS: 55,
  HOLD_MS: 1500,
};

const chevron = Array.from({ length: 9 }, (_, i) => {
  const r = Math.floor(i / 3), c = i % 3;
  return (c + Math.abs(r - 1)) * 90;
});

const ORBIT_ORDER = [0, 1, 2, 5, 8, 7, 6, 3];
const orbit = Array.from({ length: 9 }, (_, i) => {
  const k = ORBIT_ORDER.indexOf(i);
  return k === -1 ? null : k * 110;
});

export const LOADING_PATTERNS: Record<string, { delays: (number | null)[]; dur: number; round: boolean }> = {
  Drive: { delays: chevron, dur: 650, round: false },
  Dots: { delays: chevron, dur: 650, round: true },
  Orbit: { delays: orbit, dur: 950, round: false },
};

export const THINKING_CONFIG: {
  STAGES: number[];
  VARIANTS: Record<string, { active: string; done: string; rows: ThinkingRow[]; query?: string }>;
} = {
  STAGES: [800, 600, 1800, 2600, 1600],
  VARIANTS: {
    Steps: {
      active: "Berpikir",
      done: "Selesai berpikir",
      rows: [{ primary: "Memahami pertanyaan" }, { primary: "Menyusun jawaban" }],
    },
  },
};

export const SELECTION_ACTIONS = [
  { id: "Jelaskan", icon: Comment01Icon },
  { id: "Perbaiki", icon: Edit02Icon },
  { id: "Persingkat", icon: ArrowLeftRightIcon },
];
