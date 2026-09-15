"use client";

import { useEffect, useState } from "react";
import { ChartAreaInteractive } from "@/components/chart-area-interactive";
import { DataTable } from "@/components/data-table";
import { SectionCards } from "@/components/section-cards";
import { getValidToken } from "@/lib/ai-helpers";
import { Badge } from "@/components/ui/badge";

type TeacherDashboard = {
  profile?: { id: string; full_name: string; subject?: string };
  assignedClasses?: { id: string; name: string; tingkat: string }[];
  students?: { id: string; full_name: string; grade?: string; status?: string }[];
};

const initialData = [
  { id: 1, header: "Alya — Braille Dasar (Tunanetra)", type: "Tunanetra", status: "Done", target: "92", limit: "80", reviewer: "Bu Sari" },
  { id: 2, header: "Bima — Isyarat Abjad (Tunarungu)", type: "Tunarungu", status: "In Process", target: "68", limit: "75", reviewer: "Pak Dedi" },
  { id: 3, header: "Citra — Artikulasi Vokal (Tunawicara)", type: "Tunawicara", status: "Done", target: "88", limit: "80", reviewer: "Bu Sari" },
  { id: 4, header: "Modul: Membaca Audio Adaptif", type: "Tunanetra", status: "Done", target: "95", limit: "85", reviewer: "Bu Sari" },
  { id: 5, header: "Latihan: Isyarat Sehari-hari", type: "Tunarungu", status: "In Process", target: "54", limit: "70", reviewer: "Pak Dedi" },
  { id: 6, header: "Dito — Latihan Intonasi", type: "Tunawicara", status: "In Process", target: "61", limit: "70", reviewer: "Assign reviewer" },
];

export default function TeacherPage() {
  const [data, setData] = useState<TeacherDashboard | null>(null);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

  useEffect(() => {
    void (async () => {
      const token = await getValidToken();
      if (!token) return;
      try {
        const res = await fetch(`${apiUrl}/teacher/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success) setData(data);
      } catch {}
    })();
  }, [apiUrl]);

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <div className="px-4 lg:px-6">
            <h1 className="text-2xl font-semibold tracking-tight">
              Selamat datang, {data?.profile?.full_name ?? "Guru BISA"}!
            </h1>
            <p className="text-sm text-muted-foreground mt-1 max-w-3xl">
              Platform LMS inklusif untuk tunanetra, tunarungu, dan tunawicara. Pantau{" "}
              <span className="font-medium text-foreground">progres belajar</span> dan{" "}
              <span className="font-medium text-foreground">modul rekomendasi</span>.
            </p>

            {data?.assignedClasses && data.assignedClasses.length > 0 && (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-muted-foreground">Kelas Binaan:</span>
                {data.assignedClasses.map((c) => (
                  <Badge key={c.id} variant="secondary">
                    Kelas {c.name} (Tingkat {c.tingkat})
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <SectionCards />
          <div className="px-4 lg:px-6"><ChartAreaInteractive /></div>
          <div className="px-4 lg:px-6">
            <h2 className="text-sm font-semibold">Evaluasi Pembelajaran & Profil Siswa</h2>
            <p className="text-xs text-muted-foreground">Pemantauan kemajuan otomatis — kurikulum adaptif.</p>
          </div>
          <DataTable data={initialData} />
        </div>
      </div>
    </div>
  );
}
