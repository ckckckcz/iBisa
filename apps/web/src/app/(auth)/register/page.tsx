"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { ViewIcon, ViewOffSlashIcon } from "@hugeicons/core-free-icons";
import { AuthSplit } from "@/features/auth/authSplit";

const jenjangList = ["SD", "SMP", "SMA", "SMK", "MA", "SLB"] as const;

export default function Register() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [form, setForm] = useState({
    school_name: "",
    npsn: "",
    jenjang: "",
    alamat: "",
    kota: "",
    provinsi: "",
    manager_name: "",
    email: "",
    whatsapp: "",
    password: "",
    confirm_password: "",
  });

  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

  function update(k: keyof typeof form, v: string) {
    setForm((s) => ({ ...s, [k]: v }));
  }

  function validStep1() {
    return (
      form.school_name.trim().length >= 3 &&
      /^[0-9]{8,12}$/.test(form.npsn.trim()) &&
      jenjangList.includes(form.jenjang as any) &&
      form.alamat.trim().length >= 10 &&
      form.kota.trim().length >= 2 &&
      form.provinsi.trim().length >= 2
    );
  }

  function validStep2() {
    return (
      form.manager_name.trim().length >= 2 &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()) &&
      /^08[0-9]{8,13}$/.test(form.whatsapp.trim()) &&
      form.password.length >= 8 &&
      form.password === form.confirm_password
    );
  }

  async function submit() {
    setError("");
    if (!validStep1() || !validStep2()) {
      setError("Lengkapi semua field dengan benar");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message ?? "Registrasi gagal");
      router.push("/login");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const inputCls = "block w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-700/20 placeholder:text-neutral-400";
  const labelCls = "mb-1.5 block text-sm font-medium text-neutral-800";

  return (
    <AuthSplit mode="register" title="DAFTAR SEKOLAH" subtitle="Daftarkan sekolah untuk akses layanan BISA.">
      <div className="mb-6 flex items-center gap-2">
        <div className="flex items-center gap-2">
          <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${step >= 1 ? "bg-blue-700 text-white" : "bg-neutral-200 text-neutral-500"}`}>1</span>
          <span className={`text-xs font-medium ${step === 1 ? "text-blue-700" : "text-neutral-500"}`}>Data Sekolah</span>
        </div>
        <div className={`h-0.5 flex-1 ${step === 2 ? "bg-blue-700" : "bg-neutral-200"}`} />
        <div className="flex items-center gap-2">
          <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${step >= 2 ? "bg-blue-700 text-white" : "bg-neutral-200 text-neutral-500"}`}>2</span>
          <span className={`text-xs font-medium ${step === 2 ? "text-blue-700" : "text-neutral-500"}`}>Pengelola</span>
        </div>
      </div>

      {error ? <div className="mb-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div> : null}

      {step === 1 ? (
        <div className="space-y-4">
          <div>
            <label className={labelCls}>Nama Sekolah <span className="text-rose-600">*</span></label>
            <input value={form.school_name} onChange={(e) => update("school_name", e.target.value)} placeholder="SMK Negeri 4 Malang" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>NPSN <span className="text-rose-600">*</span></label>
            <input value={form.npsn} onChange={(e) => update("npsn", e.target.value)} placeholder="12345678" inputMode="numeric" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Jenjang Pendidikan <span className="text-rose-600">*</span></label>
            <select value={form.jenjang} onChange={(e) => update("jenjang", e.target.value)} className={inputCls}>
              <option value="">Pilih jenjang</option>
              {jenjangList.map((j) => (
                <option key={j} value={j}>{j}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Alamat Sekolah <span className="text-rose-600">*</span></label>
            <textarea value={form.alamat} onChange={(e) => update("alamat", e.target.value)} placeholder="Jl. Contoh No. 123" rows={3} className={inputCls} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Kota/Kabupaten <span className="text-rose-600">*</span></label>
              <input value={form.kota} onChange={(e) => update("kota", e.target.value)} placeholder="Malang" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Provinsi <span className="text-rose-600">*</span></label>
              <input value={form.provinsi} onChange={(e) => update("provinsi", e.target.value)} placeholder="Jawa Timur" className={inputCls} />
            </div>
          </div>
          <button onClick={() => validStep1() && setStep(2)} disabled={!validStep1()} className="w-full rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-40 cursor-pointer">Lanjut</button>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label className={labelCls}>Nama Pengelola <span className="text-rose-600">*</span></label>
            <input value={form.manager_name} onChange={(e) => update("manager_name", e.target.value)} placeholder="Budi Santoso" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Email Pengelola <span className="text-rose-600">*</span></label>
            <input value={form.email} onChange={(e) => update("email", e.target.value)} type="email" placeholder="you@example.com" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Nomor WhatsApp <span className="text-rose-600">*</span></label>
            <input value={form.whatsapp} onChange={(e) => update("whatsapp", e.target.value)} type="tel" placeholder="081234567890" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Password <span className="text-rose-600">*</span></label>
            <div className="relative">
              <input value={form.password} onChange={(e) => update("password", e.target.value)} type={showPassword ? "text" : "password"} placeholder="••••••••" className={`${inputCls} pr-12`} />
              <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label="Toggle password" className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-neutral-400 hover:text-neutral-700"><HugeiconsIcon icon={showPassword ? ViewOffSlashIcon : ViewIcon} size={20} /></button>
            </div>
          </div>
          <div>
            <label className={labelCls}>Konfirmasi Password <span className="text-rose-600">*</span></label>
            <div className="relative">
              <input value={form.confirm_password} onChange={(e) => update("confirm_password", e.target.value)} type={showConfirm ? "text" : "password"} placeholder="••••••••" className={`${inputCls} pr-12`} />
              <button type="button" onClick={() => setShowConfirm(!showConfirm)} aria-label="Toggle confirm password" className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-neutral-400 hover:text-neutral-700"><HugeiconsIcon icon={showConfirm ? ViewOffSlashIcon : ViewIcon} size={20} /></button>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setStep(1)} className="flex-1 rounded-lg border border-neutral-300 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-700 cursor-pointer">Kembali</button>
            <button onClick={submit} disabled={loading || !validStep2()} className="flex-1 rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-40 cursor-pointer">{loading ? "Mendaftar..." : "Daftar Sekarang"}</button>
          </div>
        </div>
      )}

      <p className="mt-6 text-center text-xs text-neutral-500">
        Dengan mendaftar, Anda menyetujui <Link href="/terms" className="font-medium text-blue-700">Syarat & Ketentuan</Link> serta <Link href="/privacy" className="font-medium text-blue-700">Kebijakan Privasi</Link>.
      </p>
    </AuthSplit>
  );
}
