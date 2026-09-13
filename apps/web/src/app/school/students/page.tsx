"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { StatCards } from "@/features/school/stat-cards";
import { MemberTable } from "@/features/school/member-table";
import { MemberForm } from "@/features/school/member-form";
import { GenderBadge, StatusBadge } from "@/features/school/member-badges";
import { initials, type ClassOption, type Column, type FormPayload, type Member } from "@/types/school";
import { getToken } from "@/lib/ai-helpers";
import { fetchSchoolList } from "@/lib/school-api";
import { CalendarOffIcon, Chart01Icon, CheckmarkCircle01Icon, StudentsIcon } from "@hugeicons/core-free-icons";

export default function StudentsPage() {
  const [rows, setRows] = useState<Member[]>([]);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Member | null>(null);
  const [saving, setSaving] = useState(false);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

  async function load() {
    const token = getToken();
    const [s, c] = await Promise.all([
      fetchSchoolList(apiUrl, token, "students"),
      fetchSchoolList(apiUrl, token, "classes").catch(() => null),
    ]);
    if (s.success) setRows(s.data);
    if (c?.success) setClasses(c.data);
  }

  useEffect(() => {
    let cancelled = false;
    const token = getToken();
    Promise.all([
      fetchSchoolList(apiUrl, token, "students"),
      fetchSchoolList(apiUrl, token, "classes").catch(() => null),
    ])
      .then(([s, c]) => {
        if (cancelled) return;
        if (s.success) setRows(s.data);
        if (c?.success) setClasses(c.data);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [apiUrl]);

  const stats = useMemo(() => {
    const total = rows.length;
    const active = rows.filter((r) => r.status === "active").length;
    const leave = rows.filter((r) => r.status === "on_leave").length;
    const avg = total ? Math.round(rows.reduce((a, r) => a + (r.attendance_pct ?? 0), 0) / total) : 0;
    return [
      { label: "Total Students", value: String(total), sub: "vs last year", delta: "4%", icon: StudentsIcon },
      { label: "Active Students", value: String(active), sub: "vs last semester", delta: "7%", down: true, icon: CheckmarkCircle01Icon },
      { label: "On Leave", value: String(leave), sub: "This Semester", delta: "4%", icon: CalendarOffIcon },
      { label: "Avg Attendance", value: `${avg}%`, sub: "This Semester", icon: Chart01Icon },
    ];
  }, [rows]);

  const gradeOpts = useMemo(() => {
    const s = new Set(rows.map((r) => r.grade).filter(Boolean) as string[]);
    return [...s].sort().map((g) => ({ value: g, label: g }));
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
    { key: "grade", label: "Grade", sortable: true, render: (m) => m.grade ?? "-" },
    { key: "gender", label: "Gender", sortable: true, render: (m) => <GenderBadge g={m.gender} /> },
    { key: "attendance_pct", label: "Attendance", sortable: true, render: (m) => <span className="tabular-nums">{m.attendance_pct ?? 0}%</span> },
    { key: "guardian_name", label: "Guardian", sortable: true, render: (m) => m.guardian_name ?? "-" },
    { key: "status", label: "Status", sortable: true, render: (m) => <StatusBadge s={m.status} /> },
  ];

  async function submit(p: FormPayload) {
    setSaving(true);
    const token = getToken();
    const body = {
      number: p.number || null, full_name: p.full_name, email: p.email || undefined,
      password: p.password || undefined, whatsapp: p.whatsapp || null,
      gender: p.gender || null, status: p.status, avatar_url: p.avatar_url || null,
      guardian_name: p.guardian_name || null, grade: p.grade || null,
      class_id: p.class_id || null, attendance_pct: p.attendance_pct,
    };
    const url = editing ? `${apiUrl}/school/users/${editing.id}` : `${apiUrl}/school/students`;
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
        <h1 className="text-xl font-semibold">Student Overview</h1>
        <p className="text-sm text-muted-foreground">Manage and monitor students</p>
      </div>
      <StatCards items={stats} />
      <div className="flex justify-end">
        <div className="flex">
          <Button className="rounded-r-none" onClick={() => { setEditing(null); setOpen(true); }}>Add Student</Button>
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
        rows={rows} columns={columns} searchPlaceholder="Search Students"
        searchKeys={["full_name", "number", "guardian_name", "grade"]}
        filters={[
          { key: "grade", label: "Class", options: gradeOpts },
          { key: "gender", label: "Gender", options: [{ value: "male", label: "Male" }, { value: "female", label: "Female" }] },
          { key: "status", label: "Status", options: [{ value: "active", label: "Active" }, { value: "on_leave", label: "On leave" }, { value: "inactive", label: "Inactive" }] },
        ]}
        exportName="students" onEdit={(m) => { setEditing(m); setOpen(true); }} onDelete={remove}
      />
      <MemberForm open={open} onOpenChange={setOpen} mode="student" initial={editing} classOptions={classes} saving={saving} apiUrl={apiUrl} onSubmit={submit} />
    </div>
  );
}
