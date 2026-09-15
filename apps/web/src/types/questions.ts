export type QuizQuestion = {
  id: string;
  question: string;
  options: [string, string, string, string];
  answerIndex: number;
  explanation: string;
};

export type Quiz = {
  id: string;
  code: string;
  title: string;
  description: string;
  subject: string;
  questionCount: number;
  timeLimit: number;
  basePoints: number;
  cover: string;
  accent: string;
  questions: QuizQuestion[];
};

export const QUIZZES: Quiz[] = [
  {
    id: "ipa-kelas-5",
    code: "241356",
    title: "IPA: Panca Indera",
    description: "Kenali fungsi mata, telinga, hidung, lidah, dan kulit.",
    subject: "IPA",
    questionCount: 5,
    timeLimit: 60,
    basePoints: 1000,
    cover: "from-blue-700 to-blue-900",
    accent: "bg-blue-700",
    questions: [
      {
        id: "ipa-1",
        question: "Bagian mata yang berfungsi menangkap cahaya disebut?",
        options: ["Retina", "Pupil", "Iris", "Kornea"],
        answerIndex: 0,
        explanation: "Retina menangkap cahaya dan mengirim sinyal ke otak lewat saraf mata.",
      },
      {
        id: "ipa-2",
        question: "Bunyi keras paling baik diredam dengan cara?",
        options: ["Menutup telinga", "Berteriak", "Membuka mulut lebar", "Tidur"],
        answerIndex: 0,
        explanation: "Menutup telinga melindungi gendang telinga dari getaran berlebih.",
      },
      {
        id: "ipa-3",
        question: "Lidah bagian depan paling peka terhadap rasa?",
        options: ["Pahit", "Asam", "Manis", "Asin"],
        answerIndex: 2,
        explanation: "Ujung lidah paling peka terhadap rasa manis.",
      },
      {
        id: "ipa-4",
        question: "Fungsi utama kulit selain pelindung adalah?",
        options: ["Melihat", "Mendengar", "Meraba suhu dan sentuhan", "Mencium bau"],
        answerIndex: 2,
        explanation: "Kulit punya saraf peraba untuk suhu, tekanan, dan sentuhan.",
      },
      {
        id: "ipa-5",
        question: "Agar hidung tetap sehat, kebiasaan yang benar adalah?",
        options: [
          "Mengorek hidung dengan jari kotor",
          "Menghirup udara bersih dan menutup hidung saat berdebu",
          "Mencium bau menyengat terus-menerus",
          "Tidak pernah membersihkan hidung",
        ],
        answerIndex: 1,
        explanation: "Udara bersih dan masker saat berdebu menjaga saluran pernapasan.",
      },
    ],
  },
  {
    id: "matematika-kelas-4",
    code: "782901",
    title: "Matematika: Berhitung Seru",
    description: "Penjumlahan, pengurangan, dan perkalian dasar.",
    subject: "Matematika",
    questionCount: 5,
    timeLimit: 60,
    basePoints: 1000,
    cover: "from-emerald-600 to-teal-800",
    accent: "bg-emerald-600",
    questions: [
      {
        id: "mtk-1",
        question: "Berapa hasil dari dua belas ditambah sembilan?",
        options: ["Dua puluh", "Dua puluh satu", "Dua puluh dua", "Sembilan belas"],
        answerIndex: 1,
        explanation: "Dua belas tambah sembilan sama dengan dua puluh satu.",
      },
      {
        id: "mtk-2",
        question: "Tiga dikali empat sama dengan?",
        options: ["Tujuh", "Dua belas", "Sembilan", "Sepuluh"],
        answerIndex: 1,
        explanation: "Tiga kali empat adalah dua belas.",
      },
      {
        id: "mtk-3",
        question: "Dua puluh dikurangi tujuh sama dengan?",
        options: ["Dua belas", "Tiga belas", "Empat belas", "Lima belas"],
        answerIndex: 1,
        explanation: "Dua puluh kurang tujuh sama dengan tiga belas.",
      },
      {
        id: "mtk-4",
        question: "Setengah dari dua puluh adalah?",
        options: ["Lima", "Sepuluh", "Delapan", "Dua belas"],
        answerIndex: 1,
        explanation: "Dua puluh dibagi dua sama dengan sepuluh.",
      },
      {
        id: "mtk-5",
        question: "Urutkan dari terkecil: 15, 9, 21, 12. Angka pertama adalah?",
        options: ["Sembilan", "Dua belas", "Lima belas", "Dua puluh satu"],
        answerIndex: 0,
        explanation: "Sembilan adalah yang terkecil di antara keempat angka itu.",
      },
    ],
  },
  {
    id: "bindo-kelas-3",
    code: "530487",
    title: "B. Indonesia: Kata & Kalimat",
    description: "Huruf kapital, tanda baca, dan lawan kata.",
    subject: "Bahasa Indonesia",
    questionCount: 4,
    timeLimit: 60,
    basePoints: 1000,
    cover: "from-amber-500 to-orange-700",
    accent: "bg-amber-600",
    questions: [
      {
        id: "bi-1",
        question: "Kalimat yang memakai huruf kapital dengan benar adalah?",
        options: [
          "saya pergi ke jakarta",
          "Saya pergi ke Jakarta",
          "saya Pergi Ke jakarta",
          "SAYA PERGI KE JAKARTA",
        ],
        answerIndex: 1,
        explanation: "Awal kalimat dan nama kota memakai huruf kapital.",
      },
      {
        id: "bi-2",
        question: "Lawan kata dari besar adalah?",
        options: ["Tinggi", "Kecil", "Luas", "Panjang"],
        answerIndex: 1,
        explanation: "Besar berlawanan dengan kecil.",
      },
      {
        id: "bi-3",
        question: "Tanda baca yang tepat untuk kalimat tanya adalah?",
        options: ["Titik", "Koma", "Tanda tanya", "Tanda seru"],
        answerIndex: 2,
        explanation: "Kalimat tanya diakhiri tanda tanya.",
      },
      {
        id: "bi-4",
        question: "Kata yang artinya sama dengan bahagia adalah?",
        options: ["Sedih", "Senang", "Marah", "Takut"],
        answerIndex: 1,
        explanation: "Bahagia bersinonim dengan senang atau gembira.",
      },
    ],
  },
];

export function getQuizByCode(code: string): Quiz | null {
  const norm = code.trim();
  return QUIZZES.find((q) => q.code === norm) ?? null;
}
