import * as XLSX from "xlsx";

export type ExcelMemberRow = {
  full_name: string;
  email: string;
  password?: string;
  whatsapp?: string;
  number?: string;
  gender?: "male" | "female";
  subject?: string;
  guardian_name?: string;
  grade?: string;
};

export async function parseExcelOrCsvFile(file: File): Promise<ExcelMemberRow[]> {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: "array" });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) return [];

  const worksheet = workbook.Sheets[firstSheetName];
  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, { defval: "" });

  const rows: ExcelMemberRow[] = [];

  for (const raw of rawRows) {
    const row: Record<string, string> = {};
    Object.keys(raw).forEach((key) => {
      row[key.trim().toLowerCase()] = String(raw[key] ?? "").trim();
    });

    const full_name = row["full_name"] || row["nama"] || row["nama_lengkap"] || row["nama lengkap"] || row["name"] || "";
    const email = row["email"] || "";

    if (!full_name || !email) continue;

    const genderVal = (row["gender"] || row["jenis_kelamin"] || row["jenis kelamin"] || "").toLowerCase();
    const gender = genderVal.startsWith("p") || genderVal === "female" || genderVal === "perempuan" ? "female" : "male";

    rows.push({
      full_name,
      email,
      password: row["password"] || undefined,
      whatsapp: row["whatsapp"] || row["wa"] || row["no_wa"] || row["nomor whatsapp"] || undefined,
      number: row["number"] || row["nip"] || row["nisn"] || row["no"] || row["nomor induk"] || undefined,
      gender,
      subject: row["subject"] || row["mata_pelajaran"] || row["mata pelajaran"] || row["mapel"] || undefined,
      guardian_name: row["guardian_name"] || row["nama_ortu"] || row["nama ortu"] || row["wali"] || row["nama wali"] || undefined,
      grade: row["grade"] || row["kelas"] || undefined,
    });
  }

  return rows;
}

export function downloadExcelTemplate(role: "teacher" | "student") {
  const isTeacher = role === "teacher";

  const templateData = isTeacher
    ? [
        {
          nama_lengkap: "Siti Rahma, S.Pd.",
          email: "siti.rahma@sekolah.sch.id",
          password: "",
          nip: "198501012010012001",
          whatsapp: "081234567890",
          jenis_kelamin: "Perempuan",
          mata_pelajaran: "Matematika",
        },
        {
          nama_lengkap: "Budi Santoso, M.T.",
          email: "budi.santoso@sekolah.sch.id",
          password: "",
          nip: "198803152014021003",
          whatsapp: "085712345678",
          jenis_kelamin: "Laki-laki",
          mata_pelajaran: "Fisika",
        },
      ]
    : [
        {
          nama_lengkap: "Ahmad Dahlan",
          email: "ahmad.dahlan@siswa.belajar.id",
          password: "",
          nisn: "0051234567",
          whatsapp: "081298765432",
          jenis_kelamin: "Laki-laki",
          nama_ortu: "Budi Santoso",
        },
        {
          nama_lengkap: "Siti Aminah",
          email: "siti.aminah@siswa.belajar.id",
          password: "",
          nisn: "0057654321",
          whatsapp: "085698765432",
          jenis_kelamin: "Perempuan",
          nama_ortu: "Rahmat Hidayat",
        },
      ];

  const worksheet = XLSX.utils.json_to_sheet(templateData);
  // Set column widths for nice formatting
  worksheet["!cols"] = [
    { wch: 25 }, // nama_lengkap
    { wch: 30 }, // email
    { wch: 15 }, // password
    { wch: 22 }, // nip/nisn
    { wch: 18 }, // whatsapp
    { wch: 15 }, // jenis_kelamin
    { wch: 22 }, // mata_pelajaran / nama_ortu
    { wch: 15 }, // kelas (if any)
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, isTeacher ? "Template Guru" : "Template Murid");

  const fileName = isTeacher ? "template_guru_bisa.xlsx" : "template_murid_bisa.xlsx";
  XLSX.writeFile(workbook, fileName);
}
