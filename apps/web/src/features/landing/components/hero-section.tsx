import Image from "next/image";
import { HeroSectionProps } from "@/lib/types";
import { Navbar } from "@/features/navbar";
import { WavyUnderline } from "@/features/landing/components/wavy-underline";
import { CloudDivider } from "@/features/landing/components/cloud-divider";

export function HeroSection({ onConsultClick, onExploreClick }: HeroSectionProps) {
  return (
    <section
      id="program"
      className="relative w-full min-h-screen overflow-hidden bg-[linear-gradient(180deg,#0a7fde_0%,#0c8ee7_45%,#40b7f2_100%)] flex flex-col items-center justify-between pt-4 sm:pt-6"
      aria-labelledby="hero-heading"
    >
      <div
        className="absolute top-0 right-0 w-45 sm:w-65 md:w-85 lg:w-105 h-60 sm:h-85 md:h-110 pointer-events-none z-0 bg-[url('/cloud-sky-feathered.png')] bg-contain bg-no-repeat bg-top-right"
        aria-hidden="true"
      />

      <Navbar onConsultClick={onConsultClick} />

      <div className="relative z-20 flex-1 flex flex-col items-center justify-center px-4 w-full text-center max-w-4xl mx-auto my-auto py-8">
        <div className="inline-flex items-center mb-3 sm:mb-4">
          <Image
            src="/google-5-0-review.png"
            alt="Penilaian Google 5.0 Bintang"
            width={120}
            height={30}
            className="h-6.5 sm:h-7.5 w-auto object-contain shadow-sm rounded-full"
            priority
          />
        </div>

        <h1
          id="hero-heading"
          className="text-white font-extrabold text-3xl sm:text-5xl md:text-6xl leading-[1.08] tracking-tight max-w-3xl drop-shadow-sm"
        >
          Pendidikan Inklusif untuk{" "}
          <span className="relative inline-block whitespace-nowrap">
            Siswa SLB
            <WavyUnderline />
          </span>
        </h1>

        <p className="text-[#cdeaff] text-xs sm:text-sm font-normal mt-2.5 sm:mt-3 max-w-lg leading-relaxed">
          Mendampingi setiap langkah tumbuh kembang anak istimewa melalui
          <br className="hidden sm:inline" />
          pendekatan adaptif, terapi terpadu, dan kasih sayang tanpa batas.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mt-5 sm:mt-6">
          <button
            type="button"
            onClick={onConsultClick}
            className="bg-white hover:bg-white/95 text-[#222222] font-semibold text-xs sm:text-sm px-5 sm:px-6 py-2.5 rounded-xl shadow-md cursor-pointer transition-transform hover:scale-[1.02] active:scale-[0.98]"
          >
            Jadwalkan Konsultasi
          </button>
          <button
            type="button"
            onClick={onExploreClick}
            className="bg-[#59b8f2]/80 hover:bg-[#59b8f2] text-white font-semibold text-xs sm:text-sm px-5 sm:px-6 py-2.5 rounded-xl border border-white/30 shadow-md cursor-pointer transition-transform hover:scale-[1.02] active:scale-[0.98]"
          >
            Lihat Program Belajar
          </button>
        </div>
      </div>

      <CloudDivider />
    </section>
  );
}
