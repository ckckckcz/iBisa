# Panduan Pengembang & Konvensi Codebase Bisa

Dokumen ini berisi panduan arsitektur monorepo, navigasi struktur proyek **Bisa**, serta Prosedur Operasional Standar (*SOP*) pengembangan untuk menambahkan endpoint API baru maupun mengintegrasikannya dari Frontend ke Backend.

---

## 1. Peta Ringkas Codebase (Codebase Map)

Bisa menggunakan struktur **Pnpm Workspace + Turborepo Monorepo**:

```
Bisa/
├── apps/
│   ├── api/                       # Express 4 + TypeScript Backend API (Port 5000)
│   │   ├── src/
│   │   │   ├── middlewares/       # Auth & Role Guards (auth.ts)
│   │   │   ├── routes/            # Express Routers (auth.ts, school.ts, teacher.ts, student.ts)
│   │   │   └── index.ts           # Express App Entry Point & Middleware setup
│   │   └── README.md              # Documentation REST API Lengkap & Matriks RBAC
│   │
│   └── web/                       # Next.js 16 App Router Frontend (Port 3000)
│       ├── src/
│       │   ├── app/               # Next.js Routes (/school, /teacher, /student, /login)
│       │   ├── components/        # Shared Shadcn UI Components
│       │   ├── features/          # Feature UI Components (school, student-quiz, ai)
│       │   ├── hooks/             # Custom React Hooks (useAuth, useChat, useAiConfig)
│       │   ├── lib/               # API Clients & Helpers (school-api.ts, csv-import.ts)
│       │   └── proxy.ts           # Next.js Route Guard Proxy Middleware
│
├── packages/
│   ├── types/                     # Shared TypeScript Interfaces (@bisa/types)
│   └── infrastructure/            # Supabase DB & External Clients (@bisa/infrastructure)
│       ├── src/
│       │   ├── auth/              # Auth Services
│       │   ├── school/            # School, Member & Batch Services
│       │   ├── classes/           # Class Services
│       │   ├── ai/                # Gemini AI Service
│       │   ├── storage/           # Supabase Avatar Storage
│       │   └── supabase/          # Supabase Admin & Client Initializer
│
└── supabase/
    └── migrations/                # Supabase Migration SQL Scripts (001_...s.d. 007_...)
```

---

## 2. Navigasi Cepat Konteks Proyek

Untuk memahami alur data dan proteksi sistem secara cepat:
1. **Spesifikasi API & Payload**: Rincian seluruh endpoint REST API dan contoh payload JSON dapat dilihat di [`apps/api/README.md`](file:///D:/hackaton/iBisa/apps/api/README.md).
2. **Definisi Entitas Shared**: Tipe data TypeScript utama tersimpan di [`packages/types/src/index.ts`](file:///D:/hackaton/iBisa/packages/types/src/index.ts).
3. **Aturan Akses Rute (Route Guard)**: Logika otorisasi rute frontend dikelola di [`apps/web/src/proxy.ts`](file:///D:/hackaton/iBisa/apps/web/src/proxy.ts).

---

## 3. Prosedur Standar (SOP) Menambah Endpoint API Baru

Setiap penambahan atau pembaruan endpoint API di proyek Bisa mengikuti 6 langkah terstruktur berikut:

### Langkah 1: Mendefinisikan Tipe Data Shared (`packages/types`)
Jika endpoint baru memerlukan struktur request atau response khusus, definisikan tipe datanya di `@bisa/types`.

*Contoh di `packages/types/src/member.ts`:*
```ts
export type FeatureRequest = {
  title: string;
  category: string;
};
```

---

### Langkah 2: Mengimplementasikan Logika Data (`packages/infrastructure`)
Tambahkan fungsi query database atau interaksi service eksternal di `packages/infrastructure/src/<domain>/`.

*Contoh di `packages/infrastructure/src/school/school.service.ts`:*
```ts
export async function getSchoolAnalytics(schoolId: string) {
  const admin = getSupabaseAdmin();
  if (!admin) throw new Error("Supabase not configured");
  
  const { data, error } = await admin
    .from("users_with_role")
    .select("role, status")
    .eq("school_id", schoolId);
    
  if (error) throw new Error(error.message);
  return data;
}
```

---

### Langkah 3: Ekspor Fungsi dari Entry Infrastructure (`packages/infrastructure/src/index.ts`)
Pastikan fungsi baru diekspor agar dapat diimpor oleh `apps/api`.

```ts
export * from "./school/index.js";
```

---

### Langkah 4: Membuat Router Express di Backend (`apps/api/src/routes/`)
Tambahkan handler router Express dengan otentikasi & proteksi role yang sesuai (`authenticate` & `authorize`).

*Standardisasi Format Response:*
- **Sukses**: `res.status(200|201).json({ success: true, data: ... })`
- **Gagal**: `res.status(400|401|403|500).json({ success: false, message: "Pesan kesalahan" })`

*Contoh di `apps/api/src/routes/school.ts`:*
```ts
import { getSchoolAnalytics } from "@bisa/infrastructure";

router.get("/analytics", async (req: Request, res: Response) => {
  const sid = schoolId(req);
  if (!sid) return err(res, 400, "Akun belum terhubung sekolah");
  
  try {
    const data = await getSchoolAnalytics(sid);
    return res.json({ success: true, data });
  } catch (e) {
    return err(res, 500, e instanceof Error ? e.message : String(e));
  }
});
```

---

### Langkah 5: Memperbarui Dokumentasi API (`apps/api/README.md`)
Setiap penambahan endpoint wajib dicatat pada `apps/api/README.md` dengan mencantumkan:
- Method & Path (`GET /school/analytics`)
- Hak akses role (`school`)
- Contoh Response JSON `200 OK` dan Error.

---

### Langkah 6: Mengonsumsi Endpoint di Frontend (`apps/web`)
Gunakan token otentikasi dari helper `getToken()` untuk memanggil API backend dari client-side React / Custom Hook.

*Contoh Pemanggilan di Client Component / Hook:*
```ts
import { getToken } from "@/lib/ai-helpers";

async function fetchAnalytics() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";
  const token = getToken();
  
  const res = await fetch(`${apiUrl}/school/analytics`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  
  const json = await res.json();
  if (json.success) {
    console.log("Analytics data:", json.data);
  }
}
```

---

## 4. Checklist Verifikasi Kompilasi

Sebelum melakukan commit, jalankan pengujian kompilasi berikut:

- [ ] `pnpm --filter @bisa/infrastructure build`
- [ ] `pnpm --filter api build`
- [ ] `pnpm --filter web build`
