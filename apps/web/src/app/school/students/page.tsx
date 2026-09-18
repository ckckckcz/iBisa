"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { StatCards } from "@/features/school/stat-cards";
import { MemberTable } from "@/features/school/member-table";
import { MemberTableSkeleton } from "@/features/school/member-table-skeleton";
import { MemberForm } from "@/features/school/member-form";
import { studentColumns } from "@/features/school/student-columns";
import { type ClassOption, type FormPayload, type Member } from "@/types/school";
import { getValidToken } from "@/lib/ai-helpers";
import { fetchSchoolList, type BatchItemResult } from "@/lib/school-api";
import { dataGet, dataSet } from "@/lib/data-cache";
import { CalendarOffIcon, Chart01Icon, CheckmarkCircle01Icon, StudentsIcon, UnfoldMoreIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { parseExcelOrCsvFile, downloadExcelTemplate, type ExcelMemberRow } from "@/lib/excel-import";
import { CsvPreviewModal } from "@/features/school/csv-preview-modal";

export default function StudentsPage() {
  const [rows, setRows] = useState<Member[]>(() => dataGet<Member[]>("school:students") ?? []);
  const [classes, setClasses] = useState<ClassOption[]>(() => dataGet<ClassOption[]>("school:classes") ?? []);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Member | null>(null);
  const [saving, setSaving] = useState(false);

  const [previewItems, setPreviewItems] = useState<ExcelMemberRow[]>([]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [batchSubmitting, setBatchSubmitting] = useState(false);
  const [loaded, setLoaded] = useState(() => dataGet<unknown>("school:students") !== null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

  async function load() {
    const token = await getValidToken();
    const [s, c] = await Promise.all([
      fetchSchoolList<Member[]>(apiUrl, token, "students"),
      fetchSchoolList<ClassOption[]>(apiUrl, token, "classes").catch(() => null),
    ]);
    if (s.success) { setRows(s.data); dataSet<Member[]>("school:students", s.data); }
    if (c?.success) { setClasses(c.data); dataSet<ClassOption[]>("school:classes", c.data); }
  }

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const token = await getValidToken();
      try {
        const [s, c] = await Promise.all([
          fetchSchoolList<Member[]>(apiUrl, token, "students"),
          fetchSchoolList<ClassOption[]>(apiUrl, token, "classes").catch(() => null),
        ]);
        if (cancelled) return;
        if (s.success) { setRows(s.data); dataSet<Member[]>("school:students", s.data); }
        if (c?.success) { setClasses(c.data); dataSet<ClassOption[]>("school:classes", c.data); }
      } catch {}
      if (!cancelled) setLoaded(true);
    })();
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

  const columns = useMemo(() => studentColumns(), []);

  async function submit(p: FormPayload) {
    setSaving(true);
    const token = await getValidToken();
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
      const res = await fetch(`${apiUrl}/school/students/batch`, {
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
          alert(`Berhasil mengimpor ${created} siswa. Gagal: ${failed} siswa (${firstErr})`);
        } else {
          alert(`Berhasil mengimpor ${created} siswa.`);
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
    downloadExcelTemplate("student");
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 lg:p-6">
      <div>
        <h1 className="text-xl font-semibold">Student Overview</h1>
        <p className="text-sm text-muted-foreground">Manage and monitor students</p>
      </div>
      <StatCards items={stats} loading={!loaded} />
      <div className="flex justify-end">
        <div className="flex">
          <Button className="rounded-r-none" onClick={() => { setEditing(null); setOpen(true); }}>Add Student</Button>
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button className="rounded-l-none border-l border-white/20 px-2"><HugeiconsIcon icon={UnfoldMoreIcon} strokeWidth={2} /></Button>} />
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => { setEditing(null); setOpen(true); }}>Tambah manual</DropdownMenuItem>
              <DropdownMenuItem onClick={() => document.getElementById("excel-student-input")?.click()}>Import Excel / CSV</DropdownMenuItem>
              <DropdownMenuItem onClick={downloadTemplate}>Download Template Excel</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <input id="excel-student-input" type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleExcelFileSelect} />
        </div>
      </div>
      {loaded ? (
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
      ) : (
      <MemberTableSkeleton />
      )}
      <MemberForm open={open} onOpenChange={setOpen} mode="student" initial={editing} classOptions={classes} saving={saving} apiUrl={apiUrl} onSubmit={submit} />
      <CsvPreviewModal
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        items={previewItems}
        mode="student"
        submitting={batchSubmitting}
        onConfirm={confirmBatchImport}
      />
    </div>
  );
}
