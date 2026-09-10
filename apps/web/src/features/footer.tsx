import Image from "next/image";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { FOOTER_COMPANY, FOOTER_RESOURCES, FOOTER_SOCIAL } from "@/lib/constants";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative w-full bg-white border-t border-neutral-100">
      <div className="mx-auto max-w-7xl px-6 sm:px-12 md:px-16 lg:px-24">
        <div className="grid grid-cols-6 gap-8 py-10 sm:py-12">
          {/* Brand */}
          <div className="col-span-6 flex flex-col gap-4 md:col-span-3">
            <Link href="#" className="flex items-center gap-2 w-max">
              <Image src="/logo1.png" alt="Logo iBisa" width={28} height={36} className="h-7 w-auto object-contain" />
              <span className="text-neutral-900 font-bold text-lg tracking-wide">iBisa</span>
            </Link>
            <p className="text-neutral-500 max-w-sm text-sm leading-relaxed text-balance">
              Platform pendampingan anak berkebutuhan khusus — terapi, pembelajaran adaptif, dan dukungan keluarga.
            </p>
            <div className="flex gap-2 mt-1">
              {FOOTER_SOCIAL.map(({ icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-md border border-neutral-200 p-1.5 text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900 transition-colors"
                >
                  <HugeiconsIcon icon={icon} size={16} strokeWidth={1.5} />
                </a>
              ))}
            </div>
          </div>

          {/* Resources */}
          <div className="col-span-3 md:col-span-1 md:col-start-5">
            <p className="text-neutral-400 mb-3 text-xs font-medium tracking-widest uppercase">Help</p>
            <ul className="flex flex-col gap-1">
              {FOOTER_RESOURCES.map(({ href, title }) => (
                <li key={title}>
                  <Link href={href} className="text-sm text-neutral-600 hover:text-neutral-900 hover:underline underline-offset-4 transition-colors py-1 inline-block">
                    {title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div className="col-span-3 md:col-span-1">
            <p className="text-neutral-400 mb-3 text-xs font-medium tracking-widest uppercase">Company</p>
            <ul className="flex flex-col gap-1">
              {FOOTER_COMPANY.map(({ href, title }) => (
                <li key={title}>
                  <Link href={href} className="text-sm text-neutral-600 hover:text-neutral-900 hover:underline underline-offset-4 transition-colors py-1 inline-block">
                    {title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-neutral-100 py-6 flex flex-col items-center">
          <p className="text-neutral-400 text-sm text-center">© {year} iBisa. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
