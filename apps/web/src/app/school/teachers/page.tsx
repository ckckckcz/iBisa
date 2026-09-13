"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { StatCards } from "@/features/school/stat-cards";
import { MemberTable } from "@/features/school/member-table";
import { MemberForm } from "@/features/school/member-form";
import { GenderBadge, StatusBadge } from "@/features/school/member-badges";
import { initials, type Column, type FormPayload, type Member } from "@/types/school";
import { getToken } from "@/lib/ai-helpers";
import { fetchSchoolList } from "@/lib/school-api";
import { BookOpen01Icon, CalendarOffIcon, CheckmarkCircle01Icon, TeacherIcon } from "@hugeicons/core-free-icons";

export default function TeachersPage() {
  const [rows, setRows] = useState<Member[]>([]);
  const [waliCount, setWaliCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Member | null>(null);
  const [saving, setSaving] = useState(false);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

  function applyTeacherData(t: { success: boolean; data: Member[] }, c: { success: boolean; data: { wali_guru_id: string | null }[] } | null) {
    if (!t.success) return;
    setRows(t.data);
    if (c?.success) {
      const ids = new Set(t.data.map((x) => x.id));
      setWaliCount(c.data.filter((k) => k.wali_guru_id && ids.has(k.wali_guru_id)).length);
    }
  }

  async function load() {
    const token = getToken();
    const [t, c] = await Promise.all([
      fetchSchoolList(apiUrl, token, "teachers"),
      fetchSchoolList(apiUrl, token, "classes").catch(() => null),
    ]);
    applyTeacherData(t, c);
  }

  useEffect(() => {
    let cancelled = false;
    const token = getToken();
    Promise.all([
      fetchSchoolList(apiUrl, token, "teachers"),
      fetchSchoolList(apiUrl, token, "classes").catch(() => null),
    ])
      .then(([t, c]) => { if (!cancelled) applyTeacherData(t, c); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [apiUrl]);

  const stats = useMemo(() => {
    const total = rows.length;
    const active = rows.filter((r) => r.status === "active").length;
    const leave = rows.filter((r) => r.status === "on_leave").length;
    return [
      { label: "Total Teachers", value: String(total), sub: "vs last year", delta: "4%", icon: TeacherIcon },
      { label: "Active Teachers", value: String(active), sub: "vs last semester", delta: "7%", down: true, icon: CheckmarkCircle01Icon },
      { label: "On Leave", value: String(leave), sub: "This Semester", delta: "4%", icon: CalendarOffIcon },
      { label: "Homeroom", value: String(waliCount), sub: "Wali kelas aktif", icon: BookOpen01Icon },
    ];
  }, [rows, waliCount]);

  const subjectOpts = useMemo(() => {
    const s = new Set(rows.map((r) => r.subject).filter(Boolean) as string[]);
    return [...s].sort().map((x) => ({ value: x, label: x }));
  }, [rows]);

  const columns: Column[] = [
    { key: "number", label: "Number", sortable: true, render: (m) => m.number ?? "-" },
    {
      key: "full_name", label: "Full Name", sortable: true,
      render: (m) => (
        <span className="inline-flex items-center gap-2">
          <Avatar className="size-7"><AvatarImage src={m.avatar_url ?? undefined} alt={m.full_name} /><AvatarFallback>{initials(m.full_name)}</AvatarFallback></Avatar>
          <span className="font-medium">{m.full_name}</span>
        </span>
      ),
    },
    { key: "subject", label: "Subject", sortable: true, render: (m) => m.subject ?? "-" },
    { key: "gender", label: "Gender", sortable: true, render: (m) => <GenderBadge g={m.gender} /> },
    { key: "whatsapp", label: "Phone", sortable: true, render: (m) => m.whatsapp ?? "-" },
    { key: "status", label: "Status", sortable: true, render: (m) => <StatusBadge s={m.status} /> },
  ];

  async function submit(p: FormPayload) {
    setSaving(true);
    const token = getToken();
    const body = {
      number: p.number || null, full_name: p.full_name, email: p.email || undefined,
      password: p.password || undefined, whatsapp: p.whatsapp || null,
      gender: p.gender || null, status: p.status, avatar_url: p.avatar_url || null,
      subject: p.subject || null, grade: p.grade || null,
    };
    const url = editing ? `${apiUrl}/school/users/${editing.id}` : `${apiUrl}/school/teachers`;
    const res = await fetch(url, { method: editing ? "PUT" : "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(body) });
    const data = await res.json().catch(() => null);
    if (!data?.success) alert(data?.message ?? "Gagal menyimpan");
    else { setOpen(false); setEditing(null); void load(); }
    setSaving(false);
  }

  async function remove(m: Member) {
    if (!confirm(`Hapus ${m.full_name}?`)) return;
    await fetch(`${apiUrl}/school/users/${m.id}`, { method: "DELETE", headers: { Authorization: `Bearer ${getToken()}` } });
    void load();
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 lg:p-6">
      <div>
        <h1 className="text-xl font-semibold">Teacher Overview</h1>
        <p className="text-sm text-muted-foreground">Manage and monitor teachers</p>
      </div>
      <StatCards items={stats} />
      <div className="flex justify-end">
        <div className="flex">
          <Button className="rounded-r-none" onClick={() => { setEditing(null); setOpen(true); }}>Add Teacher</Button>
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button className="rounded-l-none border-l border-white/20 px-2">▾</Button>} />
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => { setEditing(null); setOpen(true); }}>Tambah manual</DropdownMenuItem>
              <DropdownMenuItem onClick={() => alert("Import CSV segera hadir")}>Import CSV</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <MemberTable
        rows={rows} columns={columns} searchPlaceholder="Search Teachers"
        searchKeys={["full_name", "number", "subject"]}
        filters={[
          { key: "subject", label: "Subject", options: subjectOpts },
          { key: "gender", label: "Gender", options: [{ value: "male", label: "Male" }, { value: "female", label: "Female" }] },
          { key: "status", label: "Status", options: [{ value: "active", label: "Active" }, { value: "on_leave", label: "On leave" }, { value: "inactive", label: "Inactive" }] },
        ]}
        exportName="teachers" onEdit={(m) => { setEditing(m); setOpen(true); }} onDelete={remove}
      />
      <MemberForm open={open} onOpenChange={setOpen} mode="teacher" initial={editing} classOptions={[]} saving={saving} apiUrl={apiUrl} onSubmit={submit} />
    </div>
  );
}
