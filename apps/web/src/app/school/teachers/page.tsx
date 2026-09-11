"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type Row = { id: string; email: string; full_name: string; whatsapp: string | null };

export default function TeachersPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [form, setForm] = useState({ full_name: "", email: "", password: "", whatsapp: "" });
  const [loading, setLoading] = useState(false);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";
  function getToken() {
    if (typeof document === "undefined") return "";
    return document.cookie.split("; ").find((c) => c.startsWith("token="))?.split("=")[1] ?? localStorage.getItem("token") ?? "";
  }

  async function load() {
    const res = await fetch(`${apiUrl}/school/teachers`, { headers: { Authorization: `Bearer ${getToken()}` } });
    const data = await res.json();
    if (data.success) setRows(data.data);
    else if (!data.success) console.warn(data.message);
  }

  useEffect(() => {
    load();
  }, []);

  async function create() {
    setLoading(true);
    const res = await fetch(`${apiUrl}/school/teachers`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` }, body: JSON.stringify(form) });
    const data = await res.json();
    if (!data.success) alert(data.message);
    else {
      setForm({ full_name: "", email: "", password: "", whatsapp: "" });
      load();
    }
    setLoading(false);
  }

  async function del(id: string) {
    if (!confirm("Hapus?")) return;
    await fetch(`${apiUrl}/school/users/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${getToken()}` } });
    load();
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 lg:p-6">
      <h1 className="text-xl font-semibold">Guru</h1>
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        <Input placeholder="Nama" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
        <Input placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <Input placeholder="Password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        <Input placeholder="WA 08..." value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} />
      </div>
      <Button onClick={create} disabled={loading} className="w-fit">{loading ? "..." : "Tambah Guru"}</Button>
      <div className="rounded-lg border">
        <Table>
          <TableHeader><TableRow><TableHead>Nama</TableHead><TableHead>Email</TableHead><TableHead>WA</TableHead><TableHead></TableHead></TableRow></TableHeader>
          <TableBody>{rows.map((r) => (<TableRow key={r.id}><TableCell>{r.full_name}</TableCell><TableCell>{r.email}</TableCell><TableCell>{r.whatsapp ?? "-"}</TableCell><TableCell><Button variant="ghost" size="sm" onClick={() => del(r.id)}>Hapus</Button></TableCell></TableRow>))}</TableBody>
        </Table>
      </div>
    </div>
  );
}
