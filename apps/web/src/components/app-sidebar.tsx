"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { NavMain } from "@/components/nav-main"
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
  UserGroupIcon,
  AccessibilityIcon,
  Idea01Icon,
  Quiz02Icon,
  CourseIcon,
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

const navSchool = [
  { title: "Beranda", url: "/school", icon: <HugeiconsIcon icon={DashboardSquare01Icon} strokeWidth={2} />, items: [{ title: "Ringkasan", url: "/school" }] },
  { title: "Manajemen Akun", url: "#", icon: <HugeiconsIcon icon={UserGroupIcon} strokeWidth={2} />, items: [{ title: "Guru", url: "/school/teachers" }, { title: "Murid", url: "/school/students" }] },
  { title: "Kelas", url: "/school/classes", icon: <HugeiconsIcon icon={BookOpen02Icon} strokeWidth={2} />, items: [{ title: "Daftar Kelas", url: "/school/classes" }] },
  { title: "Chat AI", url: "/school/ai", icon: <HugeiconsIcon icon={Idea01Icon} strokeWidth={2} />, items: [{ title: "Konfigurasi AI", url: "/school/ai" }] },
];

const navTeacher = [
  { title: "Beranda", url: "/teacher", icon: <HugeiconsIcon icon={DashboardSquare01Icon} strokeWidth={2} />, items: [{ title: "Progres Belajar", url: "/teacher" }, { title: "Modul Rekomendasi", url: "#" }] },
  { title: "Bank Soal", url: "/teacher/quizzes", icon: <HugeiconsIcon icon={Quiz02Icon} strokeWidth={2} />, items: [{ title: "Daftar Soal", url: "/teacher/quizzes" }] },
  { title: "Chat AI", url: "/teacher/ai", icon: <HugeiconsIcon icon={Idea01Icon} strokeWidth={2} />, items: [{ title: "Tanya AI", url: "/teacher/ai" }] },
];

const navStudent = [
  { title: "Beranda", url: "/student", icon: <HugeiconsIcon icon={DashboardSquare01Icon} strokeWidth={2} />, items: [{ title: "Modul Saya", url: "/student" }] },
];

const navMainByRole: Record<string, typeof navSchool> = {
  school: navSchool,
  teacher: navTeacher,
  student: navStudent,
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { profile } = useAuth();
  const router = useRouter();
  const role = profile?.role ?? "school";
  const roleNav = navMainByRole[role] ?? navSchool;
  const displayName = profile?.full_name?.trim() || profile?.email?.split("@")[0] || "Pengguna BISA";
  const user = {
    name: displayName,
    email: profile?.email ?? "",
    avatar: "/avatars/shadcn.jpg",
  };
  function handleLogout() {
    document.cookie = "token=; path=/; max-age=0; SameSite=Lax";
    document.cookie = "refresh_token=; path=/; max-age=0; SameSite=Lax";
    localStorage.removeItem("token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("expires_at");
    localStorage.removeItem("profile");
    router.push("/login");
  }
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={roleNav} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} onLogout={handleLogout} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
