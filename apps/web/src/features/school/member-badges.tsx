import { STATUS_LABEL, type Member } from "@/types/school";

export function GenderBadge({ g }: { g: Member["gender"] }) {
  if (g === "male") return <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2.5 py-0.5 text-xs font-medium text-sky-700">♂ Male</span>;
  if (g === "female") return <span className="inline-flex items-center gap-1 rounded-full bg-pink-50 px-2.5 py-0.5 text-xs font-medium text-pink-700">♀ Female</span>;
  return <span className="text-muted-foreground">-</span>;
}

export function StatusBadge({ s }: { s: Member["status"] }) {
  const dot = s === "active" ? "bg-emerald-500" : s === "on_leave" ? "bg-red-400" : "bg-gray-400";
  const bg = s === "active" ? "bg-emerald-50 text-emerald-700" : s === "on_leave" ? "bg-red-50 text-red-600" : "bg-muted text-muted-foreground";
  return <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${bg}`}><span className={`size-1.5 rounded-full ${dot}`} />{STATUS_LABEL[s]}</span>;
}
