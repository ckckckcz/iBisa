"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import type { ClassOption, FormPayload, Member } from "@/types/school";
import { useMemberForm } from "@/hooks/use-member-form";

export function MemberForm({
  open, onOpenChange, mode, initial, classOptions, saving, onSubmit,
}: {
  open: boolean; onOpenChange: (v: boolean) => void;
  mode: "student" | "teacher"; initial: Member | null;
  classOptions: ClassOption[]; saving: boolean;
  onSubmit: (p: FormPayload) => void;
}) {
  const { f, set, isEdit } = useMemberForm({ open, initial });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{isEdit ? "Edit" : "Tambah"} {mode === "student" ? "Murid" : "Guru"}</SheetTitle>
          <SheetDescription>Lengkapi data di bawah. Kolom foto cukup diisi URL.</SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-3 p-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>{mode === "student" ? "NIS / Number" : "NIP / Number"}</Label>
              <Input placeholder="20260001" value={f.number} onChange={(e) => set("number", e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label>Status</Label>
              <Select value={f.status} onValueChange={(v) => set("status", v ?? "")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="on_leave">On leave</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-1.5"><Label>Nama lengkap</Label><Input placeholder="Nama" value={f.full_name} onChange={(e) => set("full_name", e.target.value)} /></div>
          {!isEdit && (
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5"><Label>Email</Label><Input placeholder="nama@sekolah.id" value={f.email} onChange={(e) => set("email", e.target.value)} /></div>
              <div className="grid gap-1.5"><Label>Password</Label><Input type="password" value={f.password} onChange={(e) => set("password", e.target.value)} /></div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>Gender</Label>
              <Select value={f.gender} onValueChange={(v) => set("gender", v ?? "")}>
                <SelectTrigger><SelectValue placeholder="Pilih" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5"><Label>WA</Label><Input placeholder="08..." value={f.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} /></div>
          </div>
          {mode === "student" ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5"><Label>Grade</Label><Input placeholder="10-A" value={f.grade} onChange={(e) => set("grade", e.target.value)} /></div>
                <div className="grid gap-1.5"><Label>Attendance %</Label><Input type="number" min={0} max={100} value={f.attendance_pct} onChange={(e) => set("attendance_pct", Number(e.target.value))} /></div>
              </div>
              <div className="grid gap-1.5">
                <Label>Kelas (opsional)</Label>
                <Select value={f.class_id} onValueChange={(v) => set("class_id", !v || v === "__none" ? "" : v)}>
                  <SelectTrigger><SelectValue placeholder="Pilih kelas" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none">Tanpa kelas</SelectItem>
                    {classOptions.map((c) => (<SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5"><Label>Wali / Guardian</Label><Input placeholder="Nama wali" value={f.guardian_name} onChange={(e) => set("guardian_name", e.target.value)} /></div>
            </>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5"><Label>Mapel / Subject</Label><Input placeholder="Matematika" value={f.subject} onChange={(e) => set("subject", e.target.value)} /></div>
              <div className="grid gap-1.5"><Label>Grade binaan (opsional)</Label><Input placeholder="10-A" value={f.grade} onChange={(e) => set("grade", e.target.value)} /></div>
            </div>
          )}
          <div className="grid gap-1.5"><Label>Foto URL (opsional)</Label><Input placeholder="https://..." value={f.avatar_url} onChange={(e) => set("avatar_url", e.target.value)} /></div>
        </div>
        <SheetFooter>
          <Button onClick={() => onSubmit(f)} disabled={saving || !f.full_name || (!isEdit && (!f.email || !f.password))}>
            {saving ? "Menyimpan..." : isEdit ? "Simpan" : "Tambah"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
