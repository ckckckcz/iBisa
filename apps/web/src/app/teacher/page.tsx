import { ChartAreaInteractive } from "@/components/chart-area-interactive";
import { DataTable } from "@/components/data-table";
import { SectionCards } from "@/components/section-cards";

const data = [
  { id: 1, header: "Alya — Braille Dasar (Tunanetra)", type: "Tunanetra", status: "Done", target: "92", limit: "80", reviewer: "Bu Sari" },
  { id: 2, header: "Bima — Isyarat Abjad (Tunarungu)", type: "Tunarungu", status: "In Process", target: "68", limit: "75", reviewer: "Pak Dedi" },
  { id: 3, header: "Citra — Artikulasi Vokal (Tunawicara)", type: "Tunawicara", status: "Done", target: "88", limit: "80", reviewer: "Bu Sari" },
  { id: 4, header: "Modul: Membaca Audio Adaptif", type: "Tunanetra", status: "Done", target: "95", limit: "85", reviewer: "Bu Sari" },
  { id: 5, header: "Latihan: Isyarat Sehari-hari", type: "Tunarungu", status: "In Process", target: "54", limit: "70", reviewer: "Pak Dedi" },
  { id: 6, header: "Dito — Latihan Intonasi", type: "Tunawicara", status: "In Process", target: "61", limit: "70", reviewer: "Assign reviewer" },
  { id: 7, header: "Eka — Gamifikasi Level 3", type: "Tunarungu", status: "Done", target: "100", limit: "90", reviewer: "Bu Sari" },
  { id: 8, header: "Modul: Angka Braille Lanjut", type: "Tunanetra", status: "In Process", target: "42", limit: "60", reviewer: "Assign reviewer" },
];

export default function TeacherPage() {
  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          {/* Header — BISA human-centered */}
          <div className="px-4 lg:px-6">
            <h1 className="text-2xl font-semibold tracking-tight">Beranda Guru BISA</h1>
            <p className="text-sm text-muted-foreground mt-1 max-w-3xl">
              Platform LMS inklusif untuk tunanetra, tunarungu, dan tunawicara. Pantau
              <span className="font-medium text-foreground"> progres belajar</span>, cek{" "}
              <span className="font-medium text-foreground">modul rekomendasi</span> yang
              dipersonalisasi, dan lihat <span className="font-medium text-foreground">notifikasi</span> — lalu arahkan siswa ke sesi pembelajaran aktif: materi atau latihan interaktif.
            </p>
          </div>

          <SectionCards />

          <div className="px-4 lg:px-6">
            <ChartAreaInteractive />
          </div>

          {/* Evaluasi Pembelajaran & Profil Siswa */}
          <div className="px-4 lg:px-6">
            <h2 className="text-sm font-semibold">Evaluasi Pembelajaran & Profil Siswa</h2>
            <p className="text-xs text-muted-foreground">Pemantauan kemajuan otomatis — kurikulum adaptif bantu atasi rasio guru-murid tinggi. Dukung SDG 4 & 10.</p>
          </div>
          <DataTable data={data} />
        </div>
      </div>
    </div>
  );
}
