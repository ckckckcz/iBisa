import { Button } from "@/components/ui/button";
import { CtaSectionProps } from "@/lib/types";

export function CtaSection({ onConsultClick }: CtaSectionProps) {
  return (
    <section id="konsultasi" className="relative w-full scroll-mt-28 overflow-hidden bg-[#2b6cb0] px-6 py-20 sm:py-24">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 75% 75% at 50% 0%, white 0%, white 70%, rgb(255 255 255 / 0) 80%), radial-gradient(ellipse 75% 75% at 50% 100%, white 0%, white 70%, rgb(255 255 255 / 0) 80%)",
        }}
      />
      <div className="relative z-10 mx-auto flex max-w-7xl flex-col items-center gap-5 text-center">
        <p className="text-black font-semibold text-xs tracking-widest uppercase">Konsultasi Gratis</p>
        <h2 className="max-w-2xl font-sans text-3xl font-bold tracking-tight text-balance text-black sm:text-4xl md:text-[44px] md:leading-tight">
          Siap lihat anak berkembang di kelas yang ngerti dia?
        </h2>

        <p className="max-w-xl font-sans text-base leading-relaxed font-medium text-black md:text-[17px]">
          Ceritain kebutuhan siswa SLB kamu, kita petakan bareng jalur inklusifnya — gratis, tanpa
          komitmen. Ketemu guru pendamping yang pas, bukan coba-coba.
        </p>

        <Button onClick={onConsultClick} variant="white" size="lg">
          Jadwalkan Konsultasi Gratis
        </Button>
      </div>
    </section>
  );
}

export default CtaSection;
