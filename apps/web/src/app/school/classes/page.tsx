"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type Kelas = { id: string; name: string; tingkat: string; wali_guru_id: string | null };
type Guru = { id: string; full_name: string };

export default function ClassesPage() {
  const [rows, setRows] = useState<Kelas[]>([]);
  const [gurus, setGurus] = useState<Guru[]>([]);
  const [form, setForm] = useState({ name: "", tingkat: "7", wali_guru_id: "" });
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";
  const token = typeof document !== "undefined" ? document.cookie.split("; ").find((c) => c.startsWith("token="))?.split("=")[1] ?? localStorage.getItem("token") ?? "" : "";

  async function load() {
    const [c, g] = await Promise.all([
      fetch(`${apiUrl}/school/classes`, { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()),
      fetch(`${apiUrl}/school/teachers`, { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()),
    ]);
    if (c.success) setRows(c.data);
    if (g.success) setGurus(g.data);
  }

  useEffect(() => {
    load();
  }, []);

  async function create() {
    const res = await fetch(`${apiUrl}/school/classes`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ ...form, wali_guru_id: form.wali_guru_id || null }) });
    const data = await res.json();
    if (!data.success) alert(data.message);
    else {
      setForm({ name: "", tingkat: "7", wali_guru_id: "" });
      load();
    }
  }

  async function del(id: string) {
    if (!confirm("Hapus kelas?")) return;
    await fetch(`${apiUrl}/school/classes/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    load();
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 lg:p-6">
      <h1 className="text-xl font-semibold">Kelas</h1>
      <div className="grid grid-cols-3 gap-2">
        <Input placeholder="Nama kelas 7A" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <Input placeholder="Tingkat 7" value={form.tingkat} onChange={(e) => setForm({ ...form, tingkat: e.target.value })} />
        <Select value={form.wali_guru_id} onValueChange={(v) => setForm({ ...form, wali_guru_id: v ?? "" })}>
          <SelectTrigger><SelectValue placeholder="Wali guru" /></SelectTrigger>
          <SelectContent>{gurus.map((g) => (<SelectItem key={g.id} value={g.id}>{g.full_name}</SelectItem>))}</SelectContent>
        </Select>
      </div>
      <Button onClick={create} className="w-fit">Tambah Kelas</Button>
      <div className="rounded-lg border">
        <Table>
          <TableHeader><TableRow><TableHead>Nama</TableHead><TableHead>Tingkat</TableHead><TableHead>Wali</TableHead><TableHead></TableHead></TableRow></TableHeader>
          <TableBody>{rows.map((r) => (<TableRow key={r.id}><TableCell>{r.name}</TableCell><TableCell>{r.tingkat}</TableCell><TableCell>{gurus.find((g) => g.id === r.wali_guru_id)?.full_name ?? "-"}</TableCell><TableCell><Button variant="ghost" size="sm" onClick={() => del(r.id)}>Hapus</Button></TableCell></TableRow>))}</TableBody>
        </Table>
      </div>
    </div>
  );
}
