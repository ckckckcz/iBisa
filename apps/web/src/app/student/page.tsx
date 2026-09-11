import { ChartAreaInteractive } from "@/components/chart-area-interactive";
import { SectionCards } from "@/components/section-cards";

export default function StudentPage() {
  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <div className="px-4 lg:px-6">
            <h1 className="text-2xl font-semibold tracking-tight">Beranda Siswa BISA</h1>
            <p className="text-sm text-muted-foreground mt-1 max-w-3xl">
              Akses <span className="font-medium text-foreground">materi adaptif</span>,{" "}
              <span className="font-medium text-foreground">latihan interaktif</span> dan{" "}
              <span className="font-medium text-foreground">progres belajar</span> personal.
            </p>
          </div>
          <SectionCards />
          <div className="px-4 lg:px-6"><ChartAreaInteractive /></div>
          <div className="px-4 lg:px-6">
            <h2 className="text-sm font-semibold">Modul Saya</h2>
            <p className="text-xs text-muted-foreground">Lanjutkan pembelajaran adaptif sesuai kebutuhan.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
