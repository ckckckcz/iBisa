import { ChartAreaInteractive } from "@/components/chart-area-interactive";
import { DataTable } from "@/components/data-table";
import { SectionCards } from "@/components/section-cards";

const data = [
  { id: 1, header: "Kelas 7A — 12 siswa ABK", type: "Inklusi", status: "Done", target: "92", limit: "80", reviewer: "Bu Sari" },
  { id: 2, header: "Kelas 8B — Program Braille", type: "Tunanetra", status: "In Process", target: "68", limit: "75", reviewer: "Pak Dedi" },
  { id: 3, header: "Kelas 9A — Isyarat Harian", type: "Tunarungu", status: "Done", target: "88", limit: "80", reviewer: "Bu Sari" },
  { id: 4, header: "Guru Pendamping — 4 aktif", type: "SDM", status: "Done", target: "95", limit: "85", reviewer: "BISA" },
  { id: 5, header: "Modul Adaptif — 24 tersedia", type: "Kurikulum", status: "In Process", target: "54", limit: "70", reviewer: "BISA" },
  { id: 6, header: "Evaluasi Semester — 6 perlu review", type: "Evaluasi", status: "In Process", target: "61", limit: "70", reviewer: "Assign reviewer" },
];

export default function SchoolPage() {
  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <div className="px-4 lg:px-6">
            <h1 className="text-2xl font-semibold tracking-tight">Beranda Sekolah BISA</h1>
            <p className="text-sm text-muted-foreground mt-1 max-w-3xl">
              Kelola <span className="font-medium text-foreground">siswa ABK</span>, pantau{" "}
              <span className="font-medium text-foreground">kelas inklusi</span> dan{" "}
              <span className="font-medium text-foreground">guru pendamping</span> — data terpusat untuk pendampingan adaptif.
            </p>
          </div>
          <SectionCards />
          <div className="px-4 lg:px-6"><ChartAreaInteractive /></div>
          <div className="px-4 lg:px-6">
            <h2 className="text-sm font-semibold">Kelas & Evaluasi Sekolah</h2>
            <p className="text-xs text-muted-foreground">Ringkasan kelas inklusi, guru pendamping, dan modul adaptif.</p>
          </div>
          <DataTable data={data} />
        </div>
      </div>
    </div>
  );
}
