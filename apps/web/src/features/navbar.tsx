import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { NAV_LINKS } from "@/lib/constants";
import { NavbarProps } from "@/lib/types";

export function Navbar({ onConsultClick }: NavbarProps) {
  return (
    <header className="w-[calc(100%-32px)] max-w-5xl h-11.5 sm:h-13 flex items-center justify-between px-4 sm:px-6 bg-white border border-black/10 rounded-lg z-30">
      <Link
        href="#"
        className="flex items-center gap-2 sm:gap-2.5 text-black font-bold text-base sm:text-lg tracking-wide hover:opacity-90 transition-opacity"
      >
        <Image
          src="/logo1.png"
          alt="Logo BISA"
          width={28}
          height={36}
          className="h-7 sm:h-7 w-auto object-contain"
          priority
        />
        <span>BISA</span>
      </Link>

      <nav className="flex items-center gap-4 sm:gap-7" aria-label="Navigasi Utama">
        {NAV_LINKS.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className="text-black/95 hover:text-black text-xs sm:text-sm font-medium transition-colors"
          >
            {item.label}
          </Link>
        ))}

        <Link href={"/login"}>
          <Button
            size="sm"
            onClick={onConsultClick}
          >
            Konsultasi
          </Button>
        </Link>
      </nav>
    </header>
  );
}
