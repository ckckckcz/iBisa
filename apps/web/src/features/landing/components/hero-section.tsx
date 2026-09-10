import Image from "next/image";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  BookOpen02Icon,
  Award01Icon,
  StarIcon,
  HeartHandshakeIcon,
} from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { HeroSectionProps } from "@/lib/types";
import { Navbar } from "@/features/navbar";
import { CloudDivider } from "@/features/landing/components/cloud-divider";

export function HeroSection({ onConsultClick }: HeroSectionProps) {
  return (
    <section
      id="program"
      className="relative w-full overflow-hidden bg-white flex flex-col items-center pt-4 sm:pt-6"
      aria-labelledby="hero-heading"
    >
      {/*<div
        className="absolute inset-x-0 top-0 h-[420px] sm:h-[480px] bg-gradient-to-b from-blue-700/25 via-blue-700/10 to-transparent pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute -top-24 left-[8%] h-72 w-72 rounded-full bg-blue-700/20 blur-3xl pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute -top-16 right-[6%] h-80 w-80 rounded-full bg-blue-700/15 blur-3xl pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute right-0 top-0 h-full w-32 sm:w-44 opacity-[0.35] pointer-events-none bg-[linear-gradient(to_right,rgba(29,78,216,0.12)_1px,transparent_1px),linear-gradient(to_bottom,rgba(29,78,216,0.12)_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:linear-gradient(to_bottom,black,transparent)]"
        aria-hidden="true"
      />*/}

      <Navbar onConsultClick={onConsultClick} />

      <div className="relative z-10 flex flex-col items-center px-4 w-full text-center max-w-3xl mx-auto pt-10 sm:pt-16">
        <h1
          id="hero-heading"
          className="text-neutral-900 font-medium text-4xl sm:text-6xl leading-[1.05] tracking-tight"
        >
          Pendidikan Inklusif
          <br />
          untuk Siswa SLB
        </h1>

        <p className="text-neutral-500 text-xs sm:text-sm font-normal mt-3 sm:mt-4 max-w-md leading-relaxed">
          Mendampingi setiap langkah tumbuh kembang anak istimewa melalui
          pendekatan adaptif, terapi terpadu, dan kasih sayang tanpa batas.
        </p>

        <div className="mt-5 sm:mt-6">
          <Button onClick={onConsultClick} variant="blue" size="default">
            <span aria-hidden="true">✦</span>
            <span>Jadwalkan Konsultasi</span>
          </Button>
        </div>

        <div className="mt-16 sm:mt-24 relative z-10 flex items-end justify-center -space-x-5 sm:-space-x-10 w-full max-w-3xl mx-auto -mb-14 sm:-mb-24">
          {/* Card 1: Kurikulum & Terapi Adaptif */}
          <div className="w-24 sm:w-44 shrink-0 aspect-3/4 origin-bottom -rotate-12 translate-y-4 z-0 bg-white border border-neutral-100/90 rounded-2xl shadow-md p-2.5 sm:p-4 flex flex-col items-start justify-between text-left">
            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
              <HugeiconsIcon icon={BookOpen02Icon} size={16} strokeWidth={1.8} />
            </div>
            <div>
              <span className="text-[7px] sm:text-[10px] font-bold tracking-wider text-blue-700 uppercase">
                Metode Adaptif
              </span>
              <h3 className="text-[8px] sm:text-xs font-bold text-neutral-900 leading-tight mt-0.5">
                Terapi & Belajar Terpadu
              </h3>
            </div>
            <div className="flex flex-col gap-1 w-full">
              <span className="inline-flex items-center text-[6px] sm:text-[9px] font-medium bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded-md">
                ✓ Sensorik & Motorik
              </span>
              <span className="inline-flex items-center text-[6px] sm:text-[9px] font-medium bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded-md">
                ✓ Terapi Wicara
              </span>
            </div>
          </div>

          {/* Card 2: Social Proof Metric */}
          <div className="w-24 sm:w-44 shrink-0 aspect-3/4 origin-bottom -rotate-6 translate-y-2 z-10 bg-white border border-neutral-100/90 rounded-2xl shadow-lg p-2.5 sm:p-4 flex flex-col items-start justify-between text-left">
            <div className="flex items-center justify-between w-full">
              <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <HugeiconsIcon icon={Award01Icon} size={16} strokeWidth={1.8} />
              </div>
              <span className="text-[7px] sm:text-[10px] font-semibold bg-amber-100/80 text-amber-900 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                <HugeiconsIcon icon={StarIcon} size={10} className="fill-amber-500 text-amber-500" />
                98%
              </span>
            </div>
            <div>
              <span className="text-base sm:text-2xl font-extrabold text-neutral-900 tracking-tight leading-none">
                1.500+
              </span>
              <p className="text-[7px] sm:text-[10px] text-neutral-600 font-medium leading-snug mt-1">
                Anak istimewa berkembang mandiri
              </p>
            </div>
            <span className="text-[6px] sm:text-[9px] font-medium text-neutral-400">
              Di 12+ SLB mitra
            </span>
          </div>

          {/* Card 3: Center Brand Card */}
          <div className="relative w-28 sm:w-48 shrink-0 aspect-3/4 origin-bottom z-20 overflow-hidden rounded-2xl border border-neutral-100 shadow-xl bg-white sm:scale-105 p-3 sm:p-5 flex flex-col items-center justify-between text-center">
            <div className="relative w-14 sm:w-24 h-14 sm:h-24 shrink-0 flex items-center justify-center">
              <Image
                src="/logo1.png"
                alt="Logo iBisa"
                fill
                sizes="(max-width: 640px) 100px, 150px"
                className="object-contain"
                priority
              />
            </div>
            <div>
              <span className="text-[9px] sm:text-sm font-bold text-neutral-900 block leading-tight">
                iBisa Inklusi
              </span>
              <span className="text-[7px] sm:text-[10px] text-neutral-500 block leading-tight mt-0.5">
                Pendidikan Siswa SLB
              </span>
            </div>
            <span className="inline-flex items-center gap-1 text-[6px] sm:text-[9px] font-semibold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-100">
              ✦ Ramah & Terarah
            </span>
          </div>

          {/* Card 4: Pendampingan Ahli */}
          <div className="relative w-24 sm:w-44 shrink-0 aspect-3/4 origin-bottom rotate-6 translate-y-2 z-10 overflow-hidden rounded-2xl border border-blue-600/30 shadow-lg bg-linear-to-b from-blue-700 to-blue-900 text-white p-2.5 sm:p-4 flex flex-col items-start justify-between text-left">
            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-white/15 backdrop-blur-xs text-white flex items-center justify-center">
              <HugeiconsIcon icon={HeartHandshakeIcon} size={16} strokeWidth={1.8} />
            </div>
            <div>
              <span className="text-[7px] sm:text-[10px] font-semibold text-blue-200 tracking-wide uppercase">
                Pendamping Ahli
              </span>
              <h3 className="text-[8px] sm:text-xs font-bold text-white leading-tight mt-0.5">
                1-on-1 Guru Khusus
              </h3>
              <p className="text-[6px] sm:text-[9px] text-blue-100/90 leading-snug mt-1">
                Dukungan personal sesuai keunikan anak.
              </p>
            </div>
            <span className="inline-flex items-center gap-1 text-[6px] sm:text-[9px] font-semibold bg-white/20 text-white px-1.5 py-0.5 rounded-md">
              ✨ Tersertifikasi
            </span>
          </div>

          {/* Card 5: Testimonial Quote */}
          <div className="w-24 sm:w-44 shrink-0 aspect-3/4 origin-bottom rotate-12 translate-y-4 z-0 bg-white border border-neutral-100/90 rounded-2xl shadow-md p-2.5 sm:p-4 flex flex-col items-start justify-between text-left">
            <div className="flex items-center gap-0.5">
              {[0, 1, 2, 3, 4].map((i) => (
                <HugeiconsIcon
                  key={i}
                  icon={StarIcon}
                  size={10}
                  className="fill-amber-400 text-amber-400"
                />
              ))}
            </div>
            <p className="text-[7px] sm:text-[10px] text-neutral-700 font-medium italic leading-snug my-0.5">
              “Anak kami jauh lebih mandiri dan ceria setiap hari.”
            </p>
            <div>
              <span className="text-[7px] sm:text-[10px] font-bold text-neutral-900 block leading-tight">
                Ibu Ratna Dewi
              </span>
              <span className="text-[6px] sm:text-[8px] text-neutral-400 block">
                Wali Murid SLB
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-30 w-full -mt-2 sm:-mt-4">
        <CloudDivider />
      </div>
    </section>
  );
}
