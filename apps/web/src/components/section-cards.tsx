"use client"

import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { HugeiconsIcon } from "@hugeicons/react"
import { UserGroupIcon, BookOpen02Icon, GameController01Icon, Alert01Icon } from "@hugeicons/core-free-icons"

export function SectionCards({
  activeStudents,
  totalQuizzes,
  engagementPct,
  needsHelpCount,
}: {
  activeStudents: number
  totalQuizzes: number
  engagementPct: number
  needsHelpCount: number
}) {
  return (
    <div className="grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4 dark:*:data-[slot=card]:bg-card">
      <Card className="@container/card">
        <CardHeader>
          <CardDescription className="flex items-center gap-1.5">
            <HugeiconsIcon icon={UserGroupIcon} strokeWidth={2} className="size-3.5 text-muted-foreground" />
            Siswa ABK Aktif
          </CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {activeStudents} siswa
          </CardTitle>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Tunanetra • Tunarungu • Tunawicara{" "}
            <HugeiconsIcon icon={UserGroupIcon} strokeWidth={2} className="size-4" />
          </div>
          <div className="text-muted-foreground">
            Human-centered, aksesibel untuk semua
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription className="flex items-center gap-1.5">
            <HugeiconsIcon icon={BookOpen02Icon} strokeWidth={2} className="size-3.5 text-muted-foreground" />
            Modul & Soal
          </CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {totalQuizzes}
          </CardTitle>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Kuis tersedia di sekolah
          </div>
          <div className="text-muted-foreground">
            Kurikulum terstruktur, terdiferensiasi
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription className="flex items-center gap-1.5">
            <HugeiconsIcon icon={GameController01Icon} strokeWidth={2} className="size-3.5 text-muted-foreground" />
            Keterlibatan (Engagement)
          </CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {engagementPct}%
          </CardTitle>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Siswa yang sudah mengerjakan kuis
          </div>
          <div className="text-muted-foreground">Gamifikasi & latihan interaktif</div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription className="flex items-center gap-1.5">
            <HugeiconsIcon icon={Alert01Icon} strokeWidth={2} className="size-3.5 text-muted-foreground" />
            Perlu Pendampingan
          </CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {needsHelpCount} siswa
          </CardTitle>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Nilai terakhir di bawah 60
          </div>
          <div className="text-muted-foreground">Alat bantu ajar otomatis</div>
        </CardFooter>
      </Card>
    </div>
  )
}