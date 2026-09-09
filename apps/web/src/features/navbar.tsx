import Link from "next/link";
import { NAV_LINKS } from "@/lib/constants";
import { NavbarProps } from "@/lib/types";

export function Navbar({ onConsultClick }: NavbarProps) {
  return (
    <header className="w-[calc(100%-32px)] max-w-5xl h-11.5 sm:h-13 flex items-center justify-between px-4 sm:px-6 bg-[#5bb4f0]/50 backdrop-blur-md border border-white/25 rounded-xl z-30 shadow-sm">
      <Link
        href="#program"
        className="text-white font-bold text-base sm:text-lg tracking-wide hover:opacity-90 transition-opacity"
      >
        iBisa
      </Link>

      <nav className="flex items-center gap-4 sm:gap-7" aria-label="Navigasi Utama">
        {NAV_LINKS.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className="text-white/95 hover:text-white text-xs sm:text-sm font-medium transition-colors"
          >
            {item.label}
          </Link>
        ))}

        <button
          type="button"
          onClick={onConsultClick}
          className="bg-white hover:bg-white/95 text-[#222222] font-semibold text-xs sm:text-sm px-4 sm:px-5 py-2 rounded-lg transition-all shadow-sm cursor-pointer hover:shadow"
        >
          Konsultasi
        </button>
      </nav>
    </header>
  );
}
