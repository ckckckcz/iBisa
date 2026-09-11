import { HugeiconsIcon } from "@hugeicons/react";
import {
  HeartHandshakeIcon,
  School01Icon,
  AccessibilityIcon,
  Award01Icon,
} from "@hugeicons/core-free-icons";
import type { StatItem, StatsSectionProps } from "@/lib/types";

const DEFAULT_STATS = [
  { icon: HeartHandshakeIcon, value: "1.500+", label: "Siswa SLB didampingi" },
  { icon: School01Icon, value: "12+", label: "SLB mitra inklusif" },
  { icon: AccessibilityIcon, value: "95%", label: "Orang tua puas progress" },
  { icon: Award01Icon, value: "8+", label: "Tahun fokus SLB" },
] as const;

export function StatsSection({ stats = DEFAULT_STATS }: StatsSectionProps) {
  return (
    <section
      className="relative w-full bg-neutral-900 py-12 sm:py-14 px-6 sm:px-12 md:px-16 lg:px-24"
      aria-label="Statistik BISA"
    >
      <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 sm:gap-10">
        {stats.map((stat: StatItem) => (
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

