"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { initials, type ClassOption, type FormPayload, type Member } from "@/types/school";
import { useMemberForm } from "@/hooks/use-member-form";
import { getToken } from "@/lib/ai-helpers";

export function MemberForm({
  open, onOpenChange, mode, initial, classOptions, saving, apiUrl, onSubmit,
}: {
  open: boolean; onOpenChange: (v: boolean) => void;
  mode: "student" | "teacher"; initial: Member | null;
  classOptions: ClassOption[]; saving: boolean; apiUrl: string;
  onSubmit: (p: FormPayload) => void;
}) {
  const { f, set, isEdit } = useMemberForm({ open, initial });
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const className = classOptions.find((c) => c.id === f.class_id)?.name ?? "";
  const grade = mode === "student" ? className || f.grade : f.grade;
  const needClass = mode === "student" && !f.class_id;
  const invalid = saving || uploading || !f.full_name || needClass || (!isEdit && (!f.email || !f.password));

  async function pickFile(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) { alert("File harus gambar"); return; }
    if (file.size > 2 * 1024 * 1024) { alert("Maksimal 2MB"); return; }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("avatar", file);
      const res = await fetch(`${apiUrl}/school/uploads/avatar`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken()}` },
        body: fd,
      });
      const data = await res.json().catch(() => null);
      if (!data?.success) alert(data?.message ?? "Upload gagal");
      else set("avatar_url", data.url);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function submit() {
    onSubmit(mode === "student" ? { ...f, grade } : f);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{isEdit ? "Edit" : "Tambah"} {mode === "student" ? "Murid" : "Guru"}</SheetTitle>
          <SheetDescription>Lengkapi data di bawah. {mode === "student" ? "Kelas wajib dipilih, grade mengikuti kelas." : ""} Foto diunggah ke penyimpanan sekolah.</SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-3 p-4">
          <div className="grid gap-1.5">
            <Label>{mode === "student" ? "NIS / Number" : "NIP / Number"}</Label>
            <Input placeholder="20260001" value={f.number} onChange={(e) => set("number", e.target.value)} />
          </div>
          <div className="grid gap-1.5">
              <Label>Status</Label>
              <Select value={f.status} onValueChange={(v) => set("status", v ?? "")}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="on_leave">On leave</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-1.5"><Label>Nama lengkap</Label><Input placeholder="Nama" value={f.full_name} onChange={(e) => set("full_name", e.target.value)} /></div>

          {!isEdit && (
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5"><Label>Email</Label><Input placeholder="nama@sekolah.id" value={f.email} onChange={(e) => set("email", e.target.value)} /></div>
              <div className="grid gap-1.5"><Label>Password</Label><Input type="password" value={f.password} onChange={(e) => set("password", e.target.value)} /></div>
            </div>
          )}

          <div className="grid gap-1.5">
              <Label>Gender</Label>
              <Select value={f.gender} onValueChange={(v) => set("gender", v ?? "")}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Pilih" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5"><Label>WA</Label><Input placeholder="08..." value={f.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} /></div>

          {mode === "student" ? (
            <>
              <div className="grid gap-1.5"><Label>Attendance %</Label><Input type="number" min={0} max={100} value={f.attendance_pct} onChange={(e) => set("attendance_pct", Number(e.target.value))} /></div>
              <div className="grid gap-1.5">
                <Label>Kelas *</Label>
                <Select value={f.class_id} onValueChange={(v) => set("class_id", v ?? "")}>
                  <SelectTrigger className="w-full">
                    <SelectValue>{className || <span className="text-muted-foreground">Pilih kelas</span>}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {classOptions.map((c) => (<SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5"><Label>Wali</Label><Input placeholder="Nama wali" value={f.guardian_name} onChange={(e) => set("guardian_name", e.target.value)} /></div>
            </>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5"><Label>Mapel / Subject</Label><Input placeholder="Matematika" value={f.subject} onChange={(e) => set("subject", e.target.value)} /></div>
              <div className="grid gap-1.5"><Label>Grade binaan</Label><Input placeholder="10-A" value={f.grade} onChange={(e) => set("grade", e.target.value)} /></div>
            </div>
          )}

          <div className="grid gap-1.5">
            <Label>Foto</Label>
            <div className="flex items-center gap-3">
              <Avatar className="size-12">
                <AvatarImage src={f.avatar_url || undefined} alt={f.full_name || "Foto"} />
                <AvatarFallback>{f.full_name ? initials(f.full_name) : "?"}</AvatarFallback>
              </Avatar>
              <div className="flex flex-wrap gap-2">
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => void pickFile(e.target.files?.[0])} />
                <Button type="button" variant="outline" size="sm" disabled={uploading} onClick={() => fileRef.current?.click()}>
                  {uploading ? "Mengunggah..." : f.avatar_url ? "Ganti foto" : "Upload foto"}
                </Button>
                {f.avatar_url && (
                  <Button type="button" variant="ghost" size="sm" disabled={uploading} onClick={() => set("avatar_url", "")}>Hapus</Button>
                )}
              </div>
            </div>
            <span className="text-xs text-muted-foreground">Gambar JPG/PNG/WebP, maksimal 2MB.</span>
          </div>
        </div>
        <SheetFooter>
          <Button onClick={submit} disabled={invalid}>
            {saving ? "Menyimpan..." : isEdit ? "Simpan" : "Tambah"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
