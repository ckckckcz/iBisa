import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { GenderBadge, StatusBadge } from "./member-badges";
import { initials, type Column } from "@/types/school";

export function studentColumns(): Column[] {
  return [
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
}
