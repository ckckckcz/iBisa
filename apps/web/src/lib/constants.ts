import { GithubIcon, YoutubeIcon } from "@hugeicons/core-free-icons";
import { FooterLink, FooterSocialLink, NavLink } from "./types";

export const NAV_LINKS: readonly NavLink[] = [
  { label: "Tentang Kami", href: "#tentang-kami" },
  { label: "Layanan", href: "#layanan" },
  { label: "Testimoni", href: "#testimoni" },
  { label: "Konsultasi", href: "#konsultasi" },
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
