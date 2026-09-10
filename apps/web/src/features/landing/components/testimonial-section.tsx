import { Marquee } from "@/components/ui/marquee";
import { TESTIMONIALS } from "@/features/landing/data/testimonials";
import { TestimonialCard } from "./testimonial-card";
import type { TestimonialSectionProps } from "@/lib/types";

export function TestimonialSection({ testimonials = TESTIMONIALS }: TestimonialSectionProps) {
  const mid = Math.ceil(testimonials.length / 2);
  const firstRow = testimonials.slice(0, mid);
  const secondRow = testimonials.slice(mid);
  const secondRowSafe = secondRow.length > 0 ? secondRow : testimonials.slice(0, mid);

  return (
    <section
      id="testimoni"
      className="relative w-full bg-white py-16 sm:py-20 md:py-24 overflow-hidden"
      aria-labelledby="testimonial-heading"
    >
      <div className="max-w-6xl mx-auto px-6 sm:px-12 md:px-16 lg:px-24">
        <div className="mb-10 sm:mb-12">
          <p className="text-blue-700 font-semibold text-xs sm:text-sm tracking-widest uppercase mb-3">
            Cerita Nyata
          </p>
          <h2
            id="testimonial-heading"
            className="text-neutral-900 font-bold text-3xl sm:text-4xl md:text-5xl leading-tight tracking-tight max-w-xl"
          >
            Orang tua bercerita tentang perubahan nyata
          </h2>
        </div>
      </div>

      <div className="relative flex w-full flex-col items-center justify-center overflow-hidden gap-3">
        <Marquee pauseOnHover className="[--duration:28s] [--gap:1rem]">
          {firstRow.map((item) => (
            <TestimonialCard key={`a-${item.name}`} {...item} />
          ))}
        </Marquee>
        <Marquee reverse pauseOnHover className="[--duration:28s] [--gap:1rem]">
          {secondRowSafe.map((item) => (
            <TestimonialCard key={`b-${item.name}`} {...item} />
          ))}
        </Marquee>
        <div className="from-white pointer-events-none absolute inset-y-0 left-0 w-1/6 bg-linear-to-r" />
        <div className="from-white pointer-events-none absolute inset-y-0 right-0 w-1/6 bg-linear-to-l" />
      </div>
    </section>
  );
}

export default TestimonialSection;
