"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { StatCards } from "@/features/school/stat-cards";
import { MemberTable } from "@/features/school/member-table";
import { MemberTableSkeleton } from "@/features/school/member-table-skeleton";
import { MemberForm } from "@/features/school/member-form";
import { GenderBadge, StatusBadge } from "@/features/school/member-badges";
import { initials, type Column, type FormPayload, type Member } from "@/types/school";
import { getValidToken } from "@/lib/ai-helpers";
import { fetchSchoolList, type BatchItemResult, type SchoolListResponse } from "@/lib/school-api";
import { dataGet, dataSet } from "@/lib/data-cache";
import { BookOpen01Icon, CalendarOffIcon, CheckmarkCircle01Icon, TeacherIcon } from "@hugeicons/core-free-icons";

import { parseExcelOrCsvFile, downloadExcelTemplate, type ExcelMemberRow } from "@/lib/excel-import";
import { CsvPreviewModal } from "@/features/school/csv-preview-modal";

export default function TeachersPage() {
  const cachedTeachers = dataGet<Member[]>("school:teachers");
  const cachedClasses = dataGet<{ id: string; name: string; wali_guru_id: string | null }[]>("school:classes");
  const [rows, setRows] = useState<Member[]>(cachedTeachers ?? []);
  const [waliCount, setWaliCount] = useState(() => {
    if (!cachedTeachers || !cachedClasses) return 0;
    const ids = new Set(cachedTeachers.map((x) => x.id));
    return cachedClasses.filter((k) => k.wali_guru_id && ids.has(k.wali_guru_id)).length;
  });
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Member | null>(null);
  const [saving, setSaving] = useState(false);
  const [classes, setClasses] = useState<{ id: string; name: string; wali_guru_id: string | null }[]>(cachedClasses ?? []);
  const [assignments, setAssignments] = useState<{ teacher_id: string; class_id: string }[]>([]);

  const [previewItems, setPreviewItems] = useState<ExcelMemberRow[]>([]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [batchSubmitting, setBatchSubmitting] = useState(false);
  const [loaded, setLoaded] = useState(() => cachedTeachers !== null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

  function applyTeacherData(
    t: SchoolListResponse<Member[]>,
    c: SchoolListResponse<{ id: string; name: string; wali_guru_id: string | null }[]> | null,
    a: SchoolListResponse<{ teacher_id: string; class_id: string }[]> | null,
  ) {
    if (!t.success) return;
    setRows(t.data);
    dataSet<Member[]>("school:teachers", t.data);
    if (c?.success) {
      setClasses(c.data);
      dataSet("school:classes", c.data);
      const ids = new Set(t.data.map((x) => x.id));
      setWaliCount(c.data.filter((k) => k.wali_guru_id && ids.has(k.wali_guru_id)).length);
    }
    if (a?.success) setAssignments(a.data);
  }

  async function load() {
    const token = await getValidToken();
    const [t, c, a] = await Promise.all([
      fetchSchoolList<Member[]>(apiUrl, token, "teachers"),
      fetchSchoolList<{ id: string; name: string; wali_guru_id: string | null }[]>(apiUrl, token, "classes").catch(() => null),
      fetchSchoolList<{ teacher_id: string; class_id: string }[]>(apiUrl, token, "teachers/assignments").catch(() => null),
    ]);
    applyTeacherData(t, c, a);
  }

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const token = await getValidToken();
      try {
        const [t, c, a] = await Promise.all([
          fetchSchoolList<Member[]>(apiUrl, token, "teachers"),
          fetchSchoolList<{ id: string; name: string; wali_guru_id: string | null }[]>(apiUrl, token, "classes").catch(() => null),
          fetchSchoolList<{ teacher_id: string; class_id: string }[]>(apiUrl, token, "teachers/assignments").catch(() => null),
        ]);
        if (!cancelled) applyTeacherData(t, c, a);
      } catch {}
      if (!cancelled) setLoaded(true);
    })();
    return () => { cancelled = true; };
  }, [apiUrl]);

  const editingTaught = useMemo(
    () => (editing ? assignments.filter((a) => a.teacher_id === editing.id).map((a) => a.class_id) : []),
    [assignments, editing]
  );
  const editingWali = useMemo(
    () => (editing ? classes.find((c) => c.wali_guru_id === editing.id)?.id ?? null : null),
    [classes, editing]
  );
  const classOptions = useMemo(() => classes.map((c) => ({ id: c.id, name: c.name })), [classes]);

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
    const token = await getValidToken();
    const body = {
      number: p.number || null, full_name: p.full_name, email: p.email || undefined,
      password: p.password || undefined, whatsapp: p.whatsapp || null,
      gender: p.gender || null, status: p.status, avatar_url: p.avatar_url || null,
      subject: p.subject || null,
      taught_class_ids: p.taught_class_ids ?? [],
      wali_class_id: p.wali_class_id || null,
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
    await fetch(`${apiUrl}/school/users/${m.id}`, { method: "DELETE", headers: { Authorization: `Bearer ${await getValidToken()}` } });
    void load();
  }

  async function handleExcelFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const items = await parseExcelOrCsvFile(file);
      if (items.length === 0) {
        alert("File Excel/CSV tidak valid atau kosong. Pastikan memuat kolom: nama_lengkap, email");
        return;
      }
      setPreviewItems(items);
      setPreviewOpen(true);
    } catch {
      alert("Gagal membaca file Excel/CSV.");
    } finally {
      e.target.value = "";
    }
  }

  async function confirmBatchImport() {
    setBatchSubmitting(true);
    try {
      const token = await getValidToken();
      const res = await fetch(`${apiUrl}/school/teachers/batch`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ items: previewItems }),
      });
      const data = await res.json().catch(() => null);
      if (data?.success) {
        const created = (data.data?.createdCount as number | undefined) ?? 0;
        const failed = (data.data?.failedCount as number | undefined) ?? 0;
        if (failed > 0) {
          const results = (data.data?.results as BatchItemResult[] | undefined) ?? [];
          const firstErr = results.find((r) => !r.success)?.error || "Email/User sudah terdaftar";
          alert(`Berhasil mengimpor ${created} guru. Gagal: ${failed} guru (${firstErr})`);
        } else {
          alert(`Berhasil mengimpor ${created} guru.`);
        }
        setPreviewOpen(false);
        setPreviewItems([]);
        void load();
      } else {
        alert(data?.message ?? "Gagal mengimpor data");
      }
    } finally {
      setBatchSubmitting(false);
    }
  }

  function downloadTemplate() {
    downloadExcelTemplate("teacher");
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 lg:p-6">
      <div>
        <h1 className="text-xl font-semibold">Teacher Overview</h1>
        <p className="text-sm text-muted-foreground">Manage and monitor teachers</p>
      </div>
      <StatCards items={stats} loading={!loaded} />
      <div className="flex justify-end">
        <div className="flex">
          <Button className="rounded-r-none" onClick={() => { setEditing(null); setOpen(true); }}>Add Teacher</Button>
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button className="rounded-l-none border-l border-white/20 px-2">▾</Button>} />
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => { setEditing(null); setOpen(true); }}>Tambah manual</DropdownMenuItem>
              <DropdownMenuItem onClick={() => document.getElementById("excel-teacher-input")?.click()}>Import Excel / CSV</DropdownMenuItem>
              <DropdownMenuItem onClick={downloadTemplate}>Download Template Excel</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <input id="excel-teacher-input" type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleExcelFileSelect} />
        </div>
      </div>
      {loaded ? (
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
      ) : (
      <MemberTableSkeleton />
      )}
      <MemberForm open={open} onOpenChange={setOpen} mode="teacher" initial={editing} classOptions={classOptions} taughtClassIds={editingTaught} waliClassId={editingWali} saving={saving} apiUrl={apiUrl} onSubmit={submit} />
      <CsvPreviewModal
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        items={previewItems}
        mode="teacher"
        submitting={batchSubmitting}
        onConfirm={confirmBatchImport}
      />
    </div>
  );
}
