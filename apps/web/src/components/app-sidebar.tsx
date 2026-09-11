"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { NavMain } from "@/components/nav-main"
import { NavProjects } from "@/components/nav-projects"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import { useAuth } from "@/hooks/use-auth"
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

const teams = [
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
];

const navMain = [
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
];

const projects = [
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
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { profile } = useAuth();
  const router = useRouter();
  const homeByRole =
    profile?.role === "teacher" ? "/teacher" : profile?.role === "student" ? "/student" : "/school";
  const navMainWithRole = navMain.map((item, i) =>
    i === 0 ? { ...item, url: homeByRole, items: item.items?.map((s, j) => (j === 0 ? { ...s, url: homeByRole } : s)) } : item
  );
  const displayName = profile?.full_name?.trim() || profile?.email?.split("@")[0] || "Pengguna BISA";
  const user = {
    name: displayName,
    email: profile?.email ?? "",
    avatar: "/avatars/shadcn.jpg",
  };
  function handleLogout() {
    document.cookie = "token=; path=/; max-age=0";
    localStorage.removeItem("token");
    localStorage.removeItem("profile");
    router.push("/login");
  }
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMainWithRole} />
        <NavProjects projects={projects} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} onLogout={handleLogout} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
