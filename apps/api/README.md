# Documentation API Backend Bisa (Express TypeScript)

Backend API Bisa dibangun dengan Express 4 & TypeScript dalam struktur monorepo Turborepo. Backend ini bertindak sebagai gateway layanan terpusat untuk otentikasi pengguna, manajemen data sekolah (guru, siswa, kelas), integrasi AI Gemini, serta layanan data dashboard.

---

## 1. Arsitektur & Lingkungan (*Environment Variables*)

### Variabel Lingkungan Wajib (`.env`)
```env
PORT=5000
SUPABASE_URL=https://<project-id>.supabase.co
SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
GEMINI_API_KEY=<gemini-api-key>
OPENAI_API_KEY=<optional-openai-key>
```

### Autentikasi & Header
Seluruh endpoint yang dilindungi (*protected endpoints*) membutuhkan header Authorization berikut:
```http
Authorization: Bearer <JWT_ACCESS_TOKEN>
```

---

## 2. Matriks Otorisasi & Peran (*Role-based Access Control*)

| Path Endpoint | Role yang Diizinkan | Keterangan |
| :--- | :--- | :--- |
| `/auth/*` | Public / Bearer Token | Registrasi, Login, & Cek Sesi |
| `/school/*` | `school` | Akses manajemen penuh Pengelola Sekolah |
| `/teacher/*` | `teacher` | Akses khusus Guru (Wali Kelas & Siswa) |
| `/student/*` | `student` | Akses khusus Siswa |

---

## 3. Dokumentasi Endpoint REST API

### A. Health Check
#### 1. `GET /health`
Menguji status server API.
- **Response `200 OK`**:
```json
{
  "success": true,
  "message": "ok",
  "supabase": "/health/supabase"
}
```

#### 2. `GET /health/supabase`
Menguji konektivitas Supabase Database Admin & Client.
- **Response `200 OK`**:
```json
{
  "success": true,
  "message": "Koneksi Supabase DB ok",
  "timestamp": "2026-09-14T16:00:00.000Z"
}
```

---

### B. Otentikasi (`/auth`)

#### 1. `POST /auth/register`
Mendaftarkan Akun Pengelola Sekolah baru (beserta Profil Sekolah) atau Akun Siswa/Guru secara mandiri.

- **Request Body (Registrasi Sekolah)**:
```json
{
  "school_name": "SLB Negeri 1 Jakarta",
  "npsn": "12345678",
  "jenjang": "SLB",
  "alamat": "Jl. Pendidikan No. 12",
  "kota": "Jakarta Selatan",
  "provinsi": "DKI Jakarta",
  "manager_name": "Budi Santoso",
  "email": "budi@slbn1jakarta.sch.id",
  "whatsapp": "081234567890",
  "password": "Password123!",
  "confirm_password": "Password123!",
  "role": "school"
}
```

- **Response `201 Created`**:
```json
{
  "success": true,
  "message": "Registrasi sekolah berhasil",
  "schoolId": "d3b07384-d113-4608-a7e9-eccd12345678",
  "userId": "a1b2c3d4-e5f6-7890-abcd-1234567890ab"
}
```

#### 2. `POST /auth/login`
Melakukan otentikasi email & password.

- **Request Body**:
```json
{
  "email": "budi@slbn1jakarta.sch.id",
  "password": "Password123!"
}
```

- **Response `200 OK`**:
```json
{
  "success": true,
  "message": "Login berhasil",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "v1.MRa...",
  "expires_at": 1757870000,
  "user": { "id": "a1b2c3d4...", "email": "budi@slbn1jakarta.sch.id" },
  "profile": {
    "id": "a1b2c3d4...",
    "email": "budi@slbn1jakarta.sch.id",
    "full_name": "Budi Santoso",
    "role": "school",
    "school_id": "d3b07384..."
  }
}
```

#### 3. `GET /auth/me`
Mengambil detail profil pengguna aktif berdasarkan Bearer Token.

- **Header**: `Authorization: Bearer <token>`
- **Response `200 OK`**:
```json
{
  "success": true,
  "user": { "id": "a1b2c3d4...", "email": "budi@slbn1jakarta.sch.id" },
  "profile": {
    "id": "a1b2c3d4...",
    "email": "budi@slbn1jakarta.sch.id",
    "full_name": "Budi Santoso",
    "role": "school",
    "school_id": "d3b07384..."
  }
}
```

---

### C. Manajemen Sekolah (`/school`)
*Catatan: Seluruh endpoint `/school/*` membutuhkan role `school`.*

#### 1. `GET /school/teachers`
Mengambil daftar guru terdaftar di sekolah tersebut.
- **Response `200 OK`**:
```json
{
  "success": true,
  "data": [
    {
      "id": "teacher-uuid-1",
      "email": "guru@slbn1.sch.id",
      "full_name": "Siti Rahma",
      "role": "teacher",
      "subject": "Matematika Inklusif",
      "status": "active"
    }
  ]
}
```

#### 2. `POST /school/teachers/batch`
Memasukkan data guru secara massal (Batch Import).
- **Request Body**:
```json
{
  "items": [
    {
      "full_name": "Ahmad Yani",
      "email": "ahmad@slbn1.sch.id",
      "subject": "Bahasa Indonesia",
      "whatsapp": "081298765432"
    },
    {
      "full_name": "Dewi Sartika",
      "email": "dewi@slbn1.sch.id",
      "subject": "IPA",
      "whatsapp": "081311223344"
    }
  ]
}
```
- **Response `201 Created`**:
```json
{
  "success": true,
  "data": {
    "createdCount": 2,
    "failedCount": 0,
    "results": [
      { "email": "ahmad@slbn1.sch.id", "success": true },
      { "email": "dewi@slbn1.sch.id", "success": true }
    ]
  }
}
```

#### 3. `POST /school/students/batch`
Memasukkan data siswa secara massal (Batch Import).
- **Request Body**:
```json
{
  "items": [
    {
      "full_name": "Bintang Pratama",
      "email": "bintang@student.slbn1.sch.id",
      "class_id": "class-uuid-10a",
      "guardian_name": "Agus Pratama"
    }
  ]
}
```
- **Response `201 Created`**:
```json
{
  "success": true,
  "data": {
    "createdCount": 1,
    "failedCount": 0,
    "results": [
      { "email": "bintang@student.slbn1.sch.id", "success": true }
    ]
  }
}
```

#### 4. `POST /school/uploads/avatar`
Upload foto profil ke Supabase Storage.
- **Content-Type**: `multipart/form-data`
- **Body Field**: `avatar` (File gambar max 2MB)
- **Response `201 Created`**:
```json
{
  "success": true,
  "url": "https://<project-id>.supabase.co/storage/v1/object/public/avatars/school-id/1726300000.png"
}
```

#### 5. `POST /school/ai/chat`
Kirim prompt chat ke AI Gemini dengan konteks sekolah.
- **Request Body**:
```json
{
  "messages": [
    { "role": "user", "content": "Buatkan draf rencana pembelajaran matematika inklusif kelas 4" }
  ]
}
```
- **Response `200 OK`**:
```json
{
  "success": true,
  "data": {
    "role": "assistant",
    "content": "Berikut draf Rencana Pembelajaran Matematika Inklusif...",
    "thoughts": ["Menganalisis kebutuhan siswa ABK", "Menyusun indikator visual"],
    "questions": [
      {
        "q": "Apakah materi fokus pada penjumlahan dasar?",
        "type": "radio",
        "options": ["Ya, penjumlahan 1-10", "Pengenalan angka", "Penjumlahan dengan gambar"]
      }
    ]
  }
}
```

---

### D. Endpoint Guru (`/teacher`)
*Catatan: Seluruh endpoint `/teacher/*` membutuhkan role `teacher`.*

#### 1. `GET /teacher/me`
Mengambil profil guru, daftar kelas yang diampu (*wali kelas*), dan daftar siswa di kelasnya.
- **Header**: `Authorization: Bearer <token>`
- **Response `200 OK`**:
```json
{
  "success": true,
  "profile": {
    "id": "teacher-uuid",
    "full_name": "Siti Rahma",
    "role": "teacher",
    "subject": "Matematika Inklusif"
  },
  "assignedClasses": [
    { "id": "class-uuid-10a", "name": "10-A", "tingkat": "10" }
  ],
  "students": [
    {
      "id": "student-uuid-1",
      "full_name": "Bintang Pratama",
      "email": "bintang@student.slbn1.sch.id",
      "class_id": "class-uuid-10a",
      "attendance_pct": 98
    }
  ]
}
```

---

### E. Endpoint Siswa (`/student`)
*Catatan: Seluruh endpoint `/student/*` membutuhkan role `student`.*

#### 1. `GET /student/me`
Mengambil profil siswa, informasi kelas, dan wali guru pengampu.
- **Header**: `Authorization: Bearer <token>`
- **Response `200 OK`**:
```json
{
  "success": true,
  "profile": {
    "id": "student-uuid-1",
    "full_name": "Bintang Pratama",
    "role": "student",
    "guardian_name": "Agus Pratama"
  },
  "class": {
    "id": "class-uuid-10a",
    "name": "10-A",
    "tingkat": "10"
  },
  "wali": {
    "id": "teacher-uuid",
    "full_name": "Siti Rahma",
    "email": "guru@slbn1.sch.id",
    "whatsapp": "081234567890"
  }
}
```

---

### F. Endpoint Kuis (`/quizzes`)
*Otorisasi per rute dicantumkan pada tiap endpoint. Seluruhnya membutuhkan `Authorization: Bearer <token>`.*

#### 1. `GET /quizzes`
Mengambil daftar kuis milik sekolah.
- **Role**: `school`, `teacher`, `student`
- **Response `200 OK`**:
```json
{
  "success": true,
  "data": [
    {
      "id": "quiz-uuid",
      "code": "482103",
      "title": "Kuis IPA Kelas 7",
      "subject": "IPA",
      "time_limit": 60,
      "base_points": 1000,
      "questions": [],
      "created_by_name": "Siti Rahma",
      "original_by_name": null
    }
  ]
}
```

#### 2. `POST /quizzes/copy`
Menyalin kuis dari Perpustakaan Soal menjadi milik guru.
- **Role**: `school`, `teacher`
- **Body**: `{ "code": "482103" }`
- **Response `200 OK`**: `{ "success": true, "data": { ... } }`

#### 3. `PUT /quizzes/:code`
Memperbarui kuis (judul, mapel, waktu, poin, soal). Hanya pemilik kuis atau admin sekolah.
- **Role**: `school`, `teacher`
- **Response `200 OK`**: `{ "success": true, "data": { ... } }`

#### 4. `DELETE /quizzes/:code`
Menghapus kuis beserta seluruh hasil (`quiz_results`) pengerjaan murid karena *cascade*. Hanya pemilik kuis atau admin sekolah.
- **Role**: `school`, `teacher`
- **Response `200 OK`**:
```json
{
  "success": true
}
```
- **Response `400 Bad Request`** (bukan pemilik / bukan admin sekolah):
```json
{
  "success": false,
  "message": "Hanya pemilik kuis atau admin sekolah yang bisa menghapus."
}
```
> Catatan: Salinan kuis oleh guru lain tetap aman — referensi `original_by` (ke tabel `users`) tidak ikut menjadi `null` saat kuis asli dihapus, karena FK menunjuk ke pengguna, bukan ke baris kuis.

---

## 4. Panduan Menjalankan API Backend

```bash
# Pindah ke direktori root monorepo
cd D:\hackaton\iBisa

# Jalankan server API backend secara mandiri
pnpm --filter @bisa/api dev

# Atau jalankan bersamaan dengan aplikasi web frontend
pnpm dev
```
