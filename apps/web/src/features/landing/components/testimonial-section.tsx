import { TestimonialSectionProps } from "@/lib/types";

const DEFAULT_TESTIMONIALS = [
  {
    quote:
      "Setelah 6 bulan bersama iBisa, anak kami yang sebelumnya tidak mau bicara sekarang sudah bisa mengungkapkan keinginannya sendiri. Perubahan yang luar biasa.",
    name: "Ibu Rina Kusuma",
    role: "Ibu dari Raffi, penyandang autisme",
    initials: "RK",
  },
  {
    quote:
      "Kami merasa tidak sendirian lagi. Tim iBisa tidak hanya mendampingi anak, tapi juga membimbing kami sebagai orang tua untuk mengerti kebutuhan si kecil.",
    name: "Bapak Dendi Santoso",
    role: "Ayah dari Nayla, tuna rungu",
    initials: "DS",
  },
  {
    quote:
      "Program literasinya luar biasa. Anak saya yang dulu susah sekali membaca, sekarang sudah bisa membaca buku cerita sendiri. Terima kasih iBisa!",
    name: "Ibu Sari Widiyanti",
    role: "Ibu dari Bintang, slow learner",
    initials: "SW",
  },
  {
    quote:
      "Pendekatan yang hangat dan penuh kasih sayang dari para terapis membuat anak saya betah dan tidak takut untuk belajar hal-hal baru setiap harinya.",
    name: "Ibu Dewi Lestari",
    role: "Ibu dari Kevin, ADHD",
    initials: "DL",
  },
] as const;

export function TestimonialSection({
  testimonials = DEFAULT_TESTIMONIALS,
}: TestimonialSectionProps) {
  return (
    <section
      id="testimoni"
      className="relative w-full bg-white py-16 sm:py-20 md:py-24 px-6 sm:px-12 md:px-16 lg:px-24"
      aria-labelledby="testimonial-heading"
    >
      <div className="max-w-6xl mx-auto">
        <div className="mb-12 sm:mb-14">
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
          {testimonials.map((item) => (
            <figure
              key={item.name}
              className="bg-neutral-50 rounded-2xl p-6 sm:p-8 border border-neutral-100 flex flex-col gap-5"
            >
              <blockquote>
                <p className="text-neutral-700 text-sm sm:text-base leading-relaxed">
                  &ldquo;{item.quote}&rdquo;
                </p>
              </blockquote>
              <figcaption className="flex items-center gap-3 mt-auto pt-4 border-t border-neutral-100">
                <div className="w-9 h-9 rounded-full bg-blue-700 flex items-center justify-center shrink-0">
                  <span className="text-white text-xs font-bold">
                    {item.initials}
                  </span>
                </div>
                <div>
                  <p className="text-neutral-900 font-semibold text-sm leading-tight">
                    {item.name}
                  </p>
                  <p className="text-neutral-400 text-xs mt-0.5">{item.role}</p>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
