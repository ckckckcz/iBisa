import type { Member, MemberStatus } from "@bisa/types";
export type { ClassOption, Gender, Member, MemberCreateBody, MemberStatus, MemberUpdateBody } from "@bisa/types";

export type Column = { key: string; label: string; sortable?: boolean; render: (m: Member) => import("react").ReactNode };
export type FilterDef = { key: string; label: string; options: { value: string; label: string }[] };

export type FormPayload = {
  number: string; full_name: string; email: string; password: string;
  whatsapp: string; gender: string; status: string; avatar_url: string;
  guardian_name: string; grade: string; subject: string; class_id: string; attendance_pct: number;
  taught_class_ids?: string[]; wali_class_id?: string;
};

export const EMPTY_FORM: FormPayload = {
  number: "", full_name: "", email: "", password: "", whatsapp: "",
  gender: "", status: "active", avatar_url: "", guardian_name: "",
  grade: "", subject: "", class_id: "", attendance_pct: 100,
};

export function toFormPayload(m: Member): FormPayload {
  return {
    number: m.number ?? "", full_name: m.full_name, email: m.email,
    password: "", whatsapp: m.whatsapp ?? "", gender: m.gender ?? "",
    status: m.status ?? "active", avatar_url: m.avatar_url ?? "",
    guardian_name: m.guardian_name ?? "", grade: m.grade ?? "",
    subject: m.subject ?? "", class_id: m.class_id ?? "",
    attendance_pct: m.attendance_pct ?? 100,
  };
}

export const STATUS_LABEL: Record<MemberStatus, string> = {
  active: "Active",
  on_leave: "On leave",
  inactive: "Inactive",
};

export function initials(name: string): string {
  return name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

export function getMemberVal(m: Member, key: string): string {
  return ((m as unknown as Record<string, unknown>)[key] ?? "").toString().toLowerCase();
}
