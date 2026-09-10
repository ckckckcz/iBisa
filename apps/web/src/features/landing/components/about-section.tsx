import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowUpRight01Icon } from "@hugeicons/core-free-icons";
export function AboutSection() {
  return (
    <section
      id="tentang-kami"
      className="relative w-full bg-white pt-10 sm:pt-14 md:pt-16 pb-20 sm:pb-28 md:pb-36 px-6 sm:px-12 md:px-16 lg:px-24 z-20"
      aria-labelledby="about-heading"
    >
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-start justify-between gap-10 md:gap-16">
        <div className="w-full md:w-70 flex flex-col items-start">
          <h2
            id="about-heading"
            className="text-[#090909] font-bold text-xs sm:text-sm tracking-widest uppercase mb-6 sm:mb-8"
          >
            TENTANG KAMI
          </h2>

          <a
            id="kontak"
            href="mailto:halo@ibisa.id"
            className="inline-flex items-center justify-between gap-4 bg-[#050505] hover:bg-[#1a1a1a] text-white px-5 py-2.5 rounded-full transition-transform hover:scale-[1.02] active:scale-[0.98] shadow-md cursor-pointer"
          >
            <span className="text-xs sm:text-sm font-medium tracking-wide">
              Hubungi Kami
            </span>
            <span
              className="w-5 h-5 rounded-full bg-white flex items-center justify-center text-[#111111]"
              aria-hidden="true"
            >
              <HugeiconsIcon
                icon={ArrowUpRight01Icon}
                size={12}
                strokeWidth={2.5}
              />
            </span>
          </a>
        </div>

        <div id="keunggulan" className="flex-1 max-w-2xl flex flex-col items-start">
          <p className="text-[#090909] font-bold text-xl sm:text-2xl md:text-3xl lg:text-4xl leading-[1.18] tracking-tight">
            Pendidikan inklusif berarti
            <br />
            <span className="text-[#090909]">SLB yang ngikutin anak,</span>{" "}
            <span className="text-[#666666]">bukan anak yang</span>
            <br />
            <span className="text-[#666666]">
              dipaksa ngikutin kelas. Di situ iBisa ada.
            </span>
          </p>

          <div id="orang-tua" className="flex items-center gap-5 sm:gap-6 mt-8 sm:mt-10">
            <span className="text-[#090909] font-extrabold text-4xl sm:text-5xl md:text-6xl leading-none tracking-tight">
              1.500+
            </span>
            <p className="text-[#090909] text-xs sm:text-sm leading-snug font-normal max-w-50">
              siswa SLB tumbuh lebih mandiri
              <br />
              di kelas inklusif kami.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
