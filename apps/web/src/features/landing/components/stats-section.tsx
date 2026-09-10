import { HugeiconsIcon } from "@hugeicons/react";
import {
  HeartHandshakeIcon,
  School01Icon,
  AccessibilityIcon,
  Award01Icon,
} from "@hugeicons/core-free-icons";
import { StatsSectionProps } from "@/lib/types";

const DEFAULT_STATS = [
  { icon: HeartHandshakeIcon, value: "1.500+", label: "Anak didampingi" },
  { icon: School01Icon, value: "12+", label: "Sekolah SLB mitra" },
  { icon: AccessibilityIcon, value: "95%", label: "Tingkat kepuasan orang tua" },
  { icon: Award01Icon, value: "8+", label: "Tahun pengalaman" },
] as const;

export function StatsSection({ stats = DEFAULT_STATS }: StatsSectionProps) {
  return (
    <section
      className="relative w-full bg-neutral-900 py-12 sm:py-14 px-6 sm:px-12 md:px-16 lg:px-24"
      aria-label="Statistik iBisa"
    >
      <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 sm:gap-10">
        {stats.map((stat) => (
          <div key={stat.label} className="flex flex-col items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center">
              <HugeiconsIcon
                icon={stat.icon}
                size={18}
                className="text-blue-300"
                strokeWidth={1.5}
              />
            </div>
            <div>
              <p className="text-white font-bold text-3xl sm:text-4xl leading-none tracking-tight">
                {stat.value}
              </p>
              <p className="text-neutral-400 text-xs sm:text-sm mt-1 leading-snug">
                {stat.label}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
