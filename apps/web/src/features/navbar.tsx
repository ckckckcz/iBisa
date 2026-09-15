"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { NAV_LINKS } from "@/lib/constants";
import { NavbarProps } from "@/lib/types";
import { HugeiconsIcon } from "@hugeicons/react";
import { Menu01Icon, Cancel01Icon, DashboardSquare01Icon } from "@hugeicons/core-free-icons";

export function Navbar({ onConsultClick }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [dashboardUrl, setDashboardUrl] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const raw = localStorage.getItem("profile");
        const profile = raw ? JSON.parse(raw) : null;
        const role = profile?.role;
        if (role === "teacher") setDashboardUrl("/teacher");
        else if (role === "student") setDashboardUrl("/student");
        else setDashboardUrl("/school");
      } catch {
        setDashboardUrl("/school");
      }
    }
  }, []);

  return (
    <header className="relative w-[calc(100%-32px)] max-w-5xl bg-white border border-black/10 rounded-lg z-30 transition-all duration-200 shadow-sm">
      <div className="h-11.5 sm:h-13 flex items-center justify-between px-4 sm:px-6">
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

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6" aria-label="Navigasi Utama">
          {NAV_LINKS.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="text-neutral-700 hover:text-black text-xs sm:text-sm font-medium transition-colors"
            >
              {item.label}
            </Link>
          ))}

          {dashboardUrl ? (
            <Link href={dashboardUrl}>
              <Button size="sm" className="gap-1.5 bg-blue-700 hover:bg-blue-800 text-white">
                <HugeiconsIcon icon={DashboardSquare01Icon} size={16} />
                Dashboard
              </Button>
            </Link>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login">
                <Button size="sm" variant="outline" className="text-xs">
                  Masuk
                </Button>
              </Link>
              <Link href="/login">
                <Button size="sm" onClick={onConsultClick} className="bg-blue-700 hover:bg-blue-800 text-white text-xs">
                  Konsultasi
                </Button>
              </Link>
            </div>
          )}
        </nav>

        {/* Mobile Actions & Hamburger Toggle */}
        <div className="md:hidden flex items-center gap-2">
          {dashboardUrl ? (
            <Link href={dashboardUrl}>
              <Button size="sm" className="gap-1 bg-blue-700 hover:bg-blue-800 text-white text-xs px-2.5 h-8">
                <HugeiconsIcon icon={DashboardSquare01Icon} size={14} />
                Dashboard
              </Button>
            </Link>
          ) : (
            <Link href="/login">
              <Button size="sm" variant="outline" className="text-xs px-2.5 h-8">
                Masuk
              </Button>
            </Link>
          )}

          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center justify-center p-1.5 text-neutral-700 hover:text-black hover:bg-neutral-100 rounded-md transition-colors"
            aria-label={isOpen ? "Tutup menu" : "Buka menu navigasi"}
          >
            <HugeiconsIcon icon={isOpen ? Cancel01Icon : Menu01Icon} size={22} />
          </button>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {isOpen && (
        <div className="md:hidden border-t border-neutral-100 px-4 py-3 flex flex-col gap-3 bg-white rounded-b-lg">
          {NAV_LINKS.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              onClick={() => setIsOpen(false)}
              className="text-neutral-700 hover:text-black text-sm font-medium py-1.5 transition-colors"
            >
              {item.label}
            </Link>
          ))}
          <div className="pt-2 border-t border-neutral-100 flex flex-col gap-2">
            {dashboardUrl ? (
              <Link href={dashboardUrl} onClick={() => setIsOpen(false)}>
                <Button size="sm" className="w-full gap-1.5 bg-blue-700 hover:bg-blue-800 text-white">
                  <HugeiconsIcon icon={DashboardSquare01Icon} size={16} />
                  Ke Dashboard
                </Button>
              </Link>
            ) : (
              <Link href="/login" onClick={() => setIsOpen(false)}>
                <Button size="sm" onClick={onConsultClick} className="w-full bg-blue-700 hover:bg-blue-800 text-white">
                  Konsultasi Gratis
                </Button>
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
