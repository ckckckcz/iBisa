import { Router, type Request, type Response } from "express";
import { getSupabaseAdmin, createSchoolWithManager, createUserWithProfile, signInWithPassword } from "@bisa/infrastructure";

const router = Router();
const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const JENJANG = ["SD", "SMP", "SMA", "SMK", "MA", "SLB"];
const trim = (v: unknown) => String(v ?? "").trim();
const isDupe = (msg: string) => /duplicate|already|exists|unique/i.test(msg);
const err = (res: Response, status: number, message: string) =>
  res.status(status).json({ success: false, message });

router.post("/register", async (req: Request, res: Response) => {
  const b = req.body ?? {};
  const name     = trim(b.school_name ?? b.nama_sekolah);
  const npsn     = trim(b.npsn);
  const jenjang  = trim(b.jenjang).toUpperCase();
  const alamat   = trim(b.alamat);
  const kota     = trim(b.kota ?? b.kabupaten);
  const provinsi = trim(b.provinsi);
  const fullName = trim(b.manager_name ?? b.nama_pengelola ?? b.full_name ?? b.name);
  const email    = trim(b.email).toLowerCase();
  const whatsapp = trim(b.whatsapp ?? b.no_wa);
  const pw       = String(b.password ?? "");
  const confirm  = String(b.confirm_password ?? b.confirmPassword ?? "");
  const role     = trim(b.role || "school").toLowerCase();

  const invalid = (
    [
      [name.length < 3,                    "Nama sekolah minimal 3 karakter"],
      [!/^\d{8,12}$/.test(npsn),           "NPSN harus 8-12 digit angka"],
      [!JENJANG.includes(jenjang),          "Jenjang tidak valid"],
      [alamat.length < 10,                  "Alamat minimal 10 karakter"],
      [!kota,                              "Kota/Kabupaten wajib diisi"],
      [!provinsi,                          "Provinsi wajib diisi"],
      [fullName.length < 2,               "Nama pengelola minimal 2 karakter"],
      [!isEmail(email),                    "Email tidak valid"],
      [!/^08\d{8,13}$/.test(whatsapp),    "Nomor WhatsApp tidak valid (08... 10-15 digit)"],
      [pw.length < 8,                      "Password minimal 8 karakter"],
      [pw !== confirm,                     "Konfirmasi password tidak cocok"],
    ] as [boolean, string][]
  ).find(([c]) => c);
  if (invalid) return err(res, 400, invalid[1]);

  const catchReg = (e: any, dupMsg: string) => {
    const msg: string = e?.message ?? "Register gagal";
    return err(res, isDupe(msg) ? 409 : 400, isDupe(msg) ? dupMsg : msg);
  };

  if (name && npsn) {
    try {
      const result = await createSchoolWithManager({
        school: { name, npsn, jenjang, alamat, kota, provinsi },
        manager: { fullName, email, password: pw, whatsapp },
      });
      return res.status(201).json({ success: true, message: "Registrasi sekolah berhasil", ...result });
    } catch (e) { return catchReg(e, "NPSN atau email sudah terdaftar"); }
  }

  if (!["student", "teacher", "school"].includes(role))
    return err(res, 400, "Role tidak valid");
  try {
    const { userId } = await createUserWithProfile({ email, password: pw, fullName, role: role as any, whatsapp });
    return res.status(201).json({ success: true, message: "Register berhasil", userId, role });
  } catch (e) { return catchReg(e, "Email sudah terdaftar"); }
});

router.post("/login", async (req: Request, res: Response) => {
  const email = trim(req.body?.email).toLowerCase();
  const { password } = req.body ?? {};
  if (!isEmail(email)) return err(res, 400, "Email tidak valid");
  if (!password) return err(res, 400, "Password wajib diisi");
  try {
    const { session, profile } = await signInWithPassword(email, password);
    return res.json({
      success: true, message: "Login berhasil",
      token: session.access_token, refresh_token: session.refresh_token,
      expires_at: session.expires_at, user: { id: session.user.id, email }, profile,
    });
  } catch (e: any) { return err(res, 401, e?.message ?? "Email atau password salah"); }
});

router.get("/me", async (req: Request, res: Response) => {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) return err(res, 401, "Missing token");
  const admin = getSupabaseAdmin();
  if (!admin) return err(res, 503, "Supabase not configured");
  const { data, error: e } = await admin.auth.getUser(auth.slice(7));
  if (e || !data.user) return err(res, 401, "Token tidak valid");
  const { data: profile } = await admin.from("users_with_role").select("*").eq("id", data.user.id).single();
  return res.json({ success: true, user: data.user, profile });
});

export default router;
