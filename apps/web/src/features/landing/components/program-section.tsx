import { HugeiconsIcon } from "@hugeicons/react";
import {
  School01Icon,
  Brain01Icon,
  HandHeartIcon,
  AccessibilityIcon,
  BookOpen02Icon,
  UsersIcon,
} from "@hugeicons/core-free-icons";
import { ProgramSectionProps } from "@/lib/types";

const DEFAULT_PROGRAMS = [
  {
    icon: Brain01Icon,
    title: "Terapi Wicara & Komunikasi",
    description:
      "Membantu anak mengembangkan kemampuan berbicara, memahami bahasa, dan berkomunikasi secara efektif dalam kehidupan sehari-hari.",
  },
  {
    icon: HandHeartIcon,
    title: "Terapi Sensori Integrasi",
    description:
      "Melatih kemampuan otak dalam memproses rangsangan indera agar anak dapat berinteraksi lebih nyaman dengan lingkungannya.",
  },
  {
    icon: School01Icon,
    title: "Pembelajaran Adaptif",
    description:
      "Kurikulum yang disesuaikan dengan kebutuhan dan kecepatan belajar masing-masing anak, mengikuti standar kurikulum SLB nasional.",
  },
  {
    icon: BookOpen02Icon,
    title: "Literasi & Numerasi Inklusif",
    description:
      "Program membaca dan berhitung dengan pendekatan multisensori yang membuat anak belajar dengan cara yang paling sesuai untuknya.",
  },
  {
    icon: AccessibilityIcon,
    title: "Kemandirian Hidup",
    description:
      "Melatih keterampilan merawat diri, mobilitas, dan aktivitas sehari-hari agar anak tumbuh mandiri dan percaya diri.",
  },
  {
    icon: UsersIcon,
    title: "Pendampingan Orang Tua",
    description:
      "Sesi bimbingan rutin bagi orang tua untuk memahami kebutuhan anak dan cara mendukung perkembangan di rumah.",
  },
] as const;

export function ProgramSection({ programs = DEFAULT_PROGRAMS }: ProgramSectionProps) {
  return (
    <section
      id="layanan"
      className="relative w-full bg-neutral-50 py-16 sm:py-20 md:py-24 px-6 sm:px-12 md:px-16 lg:px-24"
      aria-labelledby="program-heading"
    >
      <div className="max-w-6xl mx-auto">
        <div className="mb-12 sm:mb-14">
          <p className="text-blue-700 font-semibold text-xs sm:text-sm tracking-widest uppercase mb-3">
            Program Kami
          </p>
          <h2
            id="program-heading"
            className="text-neutral-900 font-bold text-3xl sm:text-4xl md:text-5xl leading-tight tracking-tight max-w-xl"
          >
            Layanan dirancang khusus untuk setiap anak istimewa
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {programs.map((program) => (
            <div
              key={program.title}
              className="group bg-white rounded-2xl p-6 sm:p-7 border border-neutral-100 hover:border-blue-100 hover:shadow-md transition-all duration-200"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center mb-5 group-hover:bg-blue-100 transition-colors">
                <HugeiconsIcon
                  icon={program.icon}
                  size={20}
                  className="text-blue-700"
                  strokeWidth={1.5}
                />
              </div>
              <h3 className="text-neutral-900 font-semibold text-sm sm:text-base mb-2 leading-snug">
                {program.title}
              </h3>
              <p className="text-neutral-500 text-xs sm:text-sm leading-relaxed">
                {program.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
