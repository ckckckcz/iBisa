"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const models = ["gpt-4o-mini", "gpt-4o", "gpt-3.5-turbo"];

export default function AiPage() {
  const [prompt, setPrompt] = useState("");
  const [model, setModel] = useState("gpt-4o-mini");
  const [chat, setChat] = useState<{ role: string; content: string }[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";
  const token = typeof document !== "undefined" ? document.cookie.split("; ").find((c) => c.startsWith("token="))?.split("=")[1] ?? localStorage.getItem("token") ?? "" : "";

  async function loadConfig() {
    const res = await fetch(`${apiUrl}/school/ai/config`, { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    if (data.success) {
      setPrompt(data.data.system_prompt);
      setModel(data.data.model);
    }
  }

  useEffect(() => {
    loadConfig();
  }, []);

  async function save() {
    const res = await fetch(`${apiUrl}/school/ai/config`, { method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ system_prompt: prompt, model }) });
    const data = await res.json();
    if (!data.success) alert(data.message);
    else alert("Tersimpan");
  }

  async function send() {
    if (!input.trim()) return;
    const next = [...chat, { role: "user", content: input }];
    setChat(next);
    setInput("");
    setLoading(true);
    const res = await fetch(`${apiUrl}/school/ai/chat`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ messages: next }) });
    const data = await res.json();
    if (data.success) setChat([...next, data.data]);
    else alert(data.message);
    setLoading(false);
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 lg:p-6">
      <h1 className="text-xl font-semibold">Chat AI</h1>
      <div className="grid gap-3 rounded-lg border p-4">
        <Select value={model} onValueChange={(v) => setModel(v ?? model)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>{models.map((m) => (<SelectItem key={m} value={m}>{m}</SelectItem>))}</SelectContent>
        </Select>
        <textarea rows={3} value={prompt} onChange={(e: any) => setPrompt(e.target.value)} placeholder="System prompt" className="block w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm" />
        <Button onClick={save} className="w-fit">Simpan Konfigurasi</Button>
      </div>
      <div className="flex flex-col gap-2 rounded-lg border p-4">
        <div className="flex flex-col gap-2">
          {chat.map((m, i) => (
            <div key={i} className={`rounded px-3 py-2 text-sm ${m.role === "user" ? "bg-blue-50" : "bg-neutral-100"}`}>{m.content}</div>
          ))}
        </div>
        <div className="flex gap-2">
          <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Tanya sesuatu..." onKeyDown={(e) => e.key === "Enter" && send()} />
          <Button onClick={send} disabled={loading}>{loading ? "..." : "Kirim"}</Button>
        </div>
      </div>
    </div>
  );
}
