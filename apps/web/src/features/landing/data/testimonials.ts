import type { TestimonialItem } from "@/lib/types";

export const TESTIMONIALS: readonly TestimonialItem[] = [
  {
    quote:
      "Setelah 6 bulan bersama BISA, anak kami yang sebelumnya tidak mau bicara sekarang sudah bisa mengungkapkan keinginannya sendiri. Perubahan yang luar biasa.",
    name: "Ibu Rina Kusuma",
    role: "Ibu dari Raffi, penyandang autisme",
    initials: "RK",
  },
  {
    quote:
      "Kami merasa tidak sendirian lagi. Tim BISA tidak hanya mendampingi anak, tapi juga membimbing kami sebagai orang tua untuk mengerti kebutuhan si kecil.",
    name: "Bapak Dendi Santoso",
    role: "Ayah dari Nayla, tuna rungu",
    initials: "DS",
  },
  {
    quote:
      "Program literasinya luar biasa. Anak saya yang dulu susah sekali membaca, sekarang sudah bisa membaca buku cerita sendiri. Terima kasih BISA!",
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
