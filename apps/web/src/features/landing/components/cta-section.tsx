import { Button } from "@/components/ui/button";
import { CtaSectionProps } from "@/lib/types";

export function CtaSection({}: CtaSectionProps) {
  return (
    <section className="relative w-full scroll-mt-28 overflow-hidden bg-[#2b6cb0] px-6 py-20 sm:py-24">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 75% 75% at 50% 0%, white 0%, white 70%, rgb(255 255 255 / 0) 80%), radial-gradient(ellipse 75% 75% at 50% 100%, white 0%, white 70%, rgb(255 255 255 / 0) 80%)",
        }}
      />
      <div className="relative z-10 mx-auto flex max-w-7xl flex-col items-center gap-5 text-center">
        <h2 className="max-w-2xl font-sans text-3xl font-bold tracking-tight text-balance text-neutral-950 sm:text-4xl md:text-[44px] md:leading-tight">
          Zaman sekarang masih nulis component dari nol?
        </h2>

        <p className="max-w-xl font-sans text-base leading-relaxed font-medium text-neutral-600 md:text-[17px]">
          Copy perintahnya, paste di terminal, langsung pakai. Nggak ada setup
          ribet, nggak ada konfigurasi panjang.
        </p>

        <div className="mt-2 flex flex-col items-center gap-3 sm:flex-row sm:gap-4">
          <Button
            href="https://github.com/polinema-ui/polinema-ui"
            target="_blank"
            rel="noopener noreferrer"
            variant="blue"
          >
            <span>Star on GitHub</span>

            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577v-2.165c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.73.083-.73 1.205.085 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.108-.775.418-1.305.762-1.605-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.5 11.5 0 0 1 12 5.803c1.02.005 2.047.138 3.006.405 2.291-1.552 3.297-1.23 3.297-1.23.653 1.652.242 2.873.119 3.176.77.84 1.235 1.91 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .322.218.694.825.576C20.565 21.796 24 17.3 24 12c0-6.63-5.37-12-12-12z"></path>
            </svg>
          </Button>
        </div>
      </div>
    </section>
  );
}

export default CtaSection;
