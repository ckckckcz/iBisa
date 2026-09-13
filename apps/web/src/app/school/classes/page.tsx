"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { StatCards } from "@/features/school/stat-cards";
import type { Member } from "@/types/school";
import { getToken } from "@/lib/ai-helpers";
import { fetchSchoolList } from "@/lib/school-api";
import { BookOpen01Icon, Chart01Icon, StudentsIcon, TeacherIcon, ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

type Kelas = { id: string; name: string; tingkat: string; wali_guru_id: string | null };
type Guru = { id: string; full_name: string };

export default function ClassesPage() {
  const router = useRouter();
  const [rows, setRows] = useState<Kelas[]>([]);
  const [gurus, setGurus] = useState<Guru[]>([]);
  const [students, setStudents] = useState<Member[]>([]);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Kelas | null>(null);
  const [form, setForm] = useState({ name: "", tingkat: "7", wali_guru_id: "" });
  const [saving, setSaving] = useState(false);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

  async function load() {
    const token = getToken();
    const [c, g, s] = await Promise.all([
      fetchSchoolList(apiUrl, token, "classes"),
      fetchSchoolList(apiUrl, token, "teachers"),
      fetchSchoolList(apiUrl, token, "students"),
    ]);
    if (c.success) setRows(c.data);
    if (g.success) setGurus(g.data);
    if (s.success) setStudents(s.data);
  }

  useEffect(() => {
    let cancelled = false;
    const token = getToken();
    Promise.all([
      fetchSchoolList(apiUrl, token, "classes"),
      fetchSchoolList(apiUrl, token, "teachers"),
      fetchSchoolList(apiUrl, token, "students"),
    ])
      .then(([c, g, s]) => {
        if (cancelled) return;
        if (c.success) setRows(c.data);
        if (g.success) setGurus(g.data);
        if (s.success) setStudents(s.data);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [apiUrl]);

  const countByClass = useMemo(() => {
    const m = new Map<string, number>();
    for (const s of students) if (s.class_id) m.set(s.class_id, (m.get(s.class_id) ?? 0) + 1);
    return m;
  }, [students]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter((r) =>
      r.name.toLowerCase().includes(needle) ||
      r.tingkat.toLowerCase().includes(needle) ||
      (gurus.find((g) => g.id === r.wali_guru_id)?.full_name ?? "").toLowerCase().includes(needle),
    );
  }, [rows, q, gurus]);

  const stats = useMemo(() => {
    const total = rows.length;
    const withWali = rows.filter((r) => r.wali_guru_id).length;
    const avg = total ? Math.round(students.length / total) : 0;
    return [
      { label: "Total Classes", value: String(total), sub: "This Semester", icon: BookOpen01Icon },
      { label: "Total Students", value: String(students.length), sub: "Enrolled", icon: StudentsIcon },
      { label: "Homeroom", value: `${withWali}/${total}`, sub: "Classes with wali", icon: TeacherIcon },
      { label: "Avg per Class", value: String(avg), sub: "Students", icon: Chart01Icon },
    ];
  }, [rows, students]);

  function openAdd() {
    setEditing(null);
    setForm({ name: "", tingkat: "7", wali_guru_id: "" });
    setOpen(true);
  }

  function openEdit(k: Kelas) {
    setEditing(k);
    setForm({ name: k.name, tingkat: k.tingkat, wali_guru_id: k.wali_guru_id ?? "" });
    setOpen(true);
  }

  async function submit() {
    if (!form.name.trim()) { alert("Nama kelas wajib"); return; }
    setSaving(true);
    const token = getToken();
    const body = { name: form.name.trim(), tingkat: form.tingkat, wali_guru_id: form.wali_guru_id || null };
    const url = editing ? `${apiUrl}/school/classes/${editing.id}` : `${apiUrl}/school/classes`;
    const res = await fetch(url, {
      method: editing ? "PUT" : "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => null);
    if (!data?.success) alert(data?.message ?? "Gagal menyimpan");
    else { setOpen(false); setEditing(null); void load(); }
    setSaving(false);
  }

  async function remove(k: Kelas) {
    const n = countByClass.get(k.id) ?? 0;
    if (!confirm(`Hapus kelas ${k.name}?${n > 0 ? ` ${n} murid jadi tanpa kelas.` : ""}`)) return;
    const token = getToken();
    await fetch(`${apiUrl}/school/classes/${k.id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    void load();
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 lg:p-6">
      <div>
        <h1 className="text-xl font-semibold">Class Overview</h1>
        <p className="text-sm text-muted-foreground">Manage classes and see enrolled students</p>
      </div>
      <StatCards items={stats} />

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <Input placeholder="Search Classes" value={q} onChange={(e) => setQ(e.target.value)} className="w-56 pl-8" />
          <span className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-muted-foreground">⌕</span>
        </div>
        <div className="ml-auto">
          <Button onClick={openAdd}>Add Class</Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.map((k) => {
          const n = countByClass.get(k.id) ?? 0;
          const wali = gurus.find((g) => g.id === k.wali_guru_id)?.full_name ?? "Tanpa wali";
          return (
            <Card
              key={k.id}
              onClick={() => router.push(`/school/classes/${k.id}`)}
              className="cursor-pointer transition-colors hover:bg-muted/50"
            >
              <CardContent className="flex flex-col gap-1 p-4">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-semibold tracking-tight">{k.name}</span>
                  <span className="rounded-full bg-sky-50 px-2 py-0.5 text-xs font-medium text-sky-700">Tingkat {k.tingkat}</span>
                  <div className="ml-auto" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm">···</Button>} />
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEdit(k)}>Edit</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => remove(k)}>Hapus</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                <span className="text-sm text-muted-foreground">Wali: {wali}</span>
                <span className="text-sm"><span className="font-semibold">{n}</span> murid terdaftar</span>
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">Klik untuk lihat murid <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} className="size-3.5" /></span>
              </CardContent>
            </Card>
          );
        })}
        {filtered.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground sm:col-span-2 xl:col-span-3">Belum ada kelas</p>
        )}
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle>{editing ? "Edit" : "Tambah"} Kelas</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col gap-3 p-4">
            <div className="grid gap-1.5"><Label>Nama kelas</Label><Input placeholder="10-A" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="grid gap-1.5"><Label>Tingkat</Label><Input placeholder="10" value={form.tingkat} onChange={(e) => setForm({ ...form, tingkat: e.target.value })} /></div>
            <div className="grid gap-1.5">
              <Label>Wali guru</Label>
              <Select value={form.wali_guru_id} onValueChange={(v) => setForm({ ...form, wali_guru_id: v === "__none" ? "" : (v ?? "") })}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Pilih wali" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none">Tanpa wali</SelectItem>
                  {gurus.map((g) => (<SelectItem key={g.id} value={g.id}>{g.full_name}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <SheetFooter>
            <Button onClick={submit} disabled={saving || !form.name.trim()}>{saving ? "Menyimpan..." : editing ? "Simpan" : "Tambah"}</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
