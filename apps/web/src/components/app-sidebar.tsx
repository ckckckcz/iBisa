"use client"

import * as React from "react"

import { NavMain } from "@/components/nav-main"
import { NavProjects } from "@/components/nav-projects"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  DashboardSquare01Icon,
  BookOpen02Icon,
  Analytics01Icon,
  GameController01Icon,
  UserGroupIcon,
  AccessibilityIcon,
  Idea01Icon,
  Task01Icon,
  Award01Icon,
  Settings05Icon,
} from "@hugeicons/core-free-icons"
import Image from "next/image"

const data = {
  user: {
    name: "Bu Sari — Guru Inklusif",
    email: "sari@bisa.id",
    avatar: "/avatars/shadcn.jpg",
  },
  teams: [
    {
      name: "BISA LMS",
      logo: (
        <Image
          src="/logo1.png"
          alt="BISA LMS"
          width={32}
          height={32}
          className="size-8 shrink-0 object-contain"
          priority
        />
      ),
      plan: "LMS Inklusif • SDG 4 & 10",
    },
    {
      name: "SLB Harapan Bangsa",
      logo: <HugeiconsIcon icon={AccessibilityIcon} strokeWidth={2} />,
      plan: "12 kelas • 48 siswa ABK",
    },
    {
      name: "Kelas Inklusi Reguler",
      logo: <HugeiconsIcon icon={UserGroupIcon} strokeWidth={2} />,
      plan: "Model percontohan nasional",
    },
  ],
  navMain: [
    {
      title: "Beranda",
      url: "/teacher",
      icon: <HugeiconsIcon icon={DashboardSquare01Icon} strokeWidth={2} />,
      isActive: true,
      items: [
        { title: "Progres Belajar", url: "/teacher" },
        { title: "Modul Rekomendasi", url: "#" },
        { title: "Notifikasi", url: "#" },
      ],
    },
    {
      title: "Sesi Pembelajaran",
      url: "#",
      icon: <HugeiconsIcon icon={BookOpen02Icon} strokeWidth={2} />,
      items: [
        { title: "Materi Pembelajaran", url: "#" },
        { title: "Latihan Soal Interaktif", url: "#" },
        { title: "Sesi Aktif Hari Ini", url: "#" },
      ],
    },
    {
      title: "Kurikulum Adaptif",
      url: "#",
      icon: <HugeiconsIcon icon={Idea01Icon} strokeWidth={2} />,
      items: [
        { title: "Jalur Personal", url: "#" },
        { title: "Kecepatan & Gaya Belajar", url: "#" },
        { title: "Aksesibilitas", url: "#" },
      ],
    },
    {
      title: "Gamifikasi & Engagement",
      url: "#",
      icon: <HugeiconsIcon icon={GameController01Icon} strokeWidth={2} />,
      items: [
        { title: "Papan Peringkat", url: "#" },
        { title: "Lencana & Reward", url: "#" },
        { title: "Tantangan Mingguan", url: "#" },
      ],
    },
    {
      title: "Evaluasi & Profil",
      url: "#",
      icon: <HugeiconsIcon icon={Analytics01Icon} strokeWidth={2} />,
      items: [
        { title: "Evaluasi Pembelajaran", url: "#" },
        { title: "Profil Siswa ABK", url: "#" },
        { title: "Laporan Kemajuan", url: "#" },
      ],
    },
    {
      title: "Pengaturan",
      url: "#",
      icon: <HugeiconsIcon icon={Settings05Icon} strokeWidth={2} />,
      items: [
        { title: "Kelas & Rasio Guru-Murid", url: "#" },
        { title: "Bantuan Ajar", url: "#" },
        { title: "Akses Orang Tua", url: "#" },
      ],
    },
  ],
  projects: [
    {
      name: "Tunanetra — Braille & Audio",
      url: "#",
      icon: <HugeiconsIcon icon={Task01Icon} strokeWidth={2} />,
    },
    {
      name: "Tunarungu — Isyarat Visual",
      url: "#",
      icon: <HugeiconsIcon icon={Award01Icon} strokeWidth={2} />,
    },
    {
      name: "Tunawicara — Artikulasi",
      url: "#",
      icon: <HugeiconsIcon icon={AccessibilityIcon} strokeWidth={2} />,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavProjects projects={data.projects} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
