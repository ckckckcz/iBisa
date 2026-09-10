import {
  Brain01Icon,
  HeartHandshakeIcon,
  School01Icon,
  BookOpen02Icon,
  UsersIcon,
} from "@hugeicons/core-free-icons";
import type { ProgramItem } from "@/lib/types";

export const PROGRAMS: readonly ProgramItem[] = [
  {
    icon: Brain01Icon,
    title: "Terapi Wicara",
    description:
      "Dari tunjuk-tunjuk jadi bisa bilang “mau”. Latihan ngobrol pelan-pelan sampai anak berani ngomong sendiri.",
  },
  {
    icon: HeartHandshakeIcon,
    title: "Nggak Kagetan Lagi",
    description:
      "Dulu tutup telinga tiap dengar bel. Sekarang bisa duduk tenang di kelas — dilatih lewat main sensori yang bertahap, bukan dipaksa.",
  },
  {
    icon: School01Icon,
    title: "Belajar Ngikutin Anak",
    description:
      "Bukan anak dipaksa ngejar kurikulum. Materi yang ngejar kecepatan anak — standar SLB tetap jalan.",
  },
  {
    icon: BookOpen02Icon,
    title: "Baca-Tulis Jadi Main",
    description:
      "Huruf yang dulu loncat-loncat jadi bisa dirangkai. Nggak hafalan tegang — pakai gambar & gerakan sampai buku cerita pertama kelar sendiri.",
  },
  {
    icon: UsersIcon,
    title: "Forum Orang Tua",
    description:
      "Tengah malam kepikiran anak, nggak perlu dipendam sendiri. Curhat, tanya ahlinya.",
  },
] as const;
