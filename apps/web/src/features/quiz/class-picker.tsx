"use client";

import type { AssignableClass } from "@/lib/quizzes";

export function ClassPickerChips({
  classes,
  selectedIds,
  loading,
  solidClass,
  onToggle,
  disabled,
}: {
  classes: AssignableClass[];
  selectedIds: string[];
  loading: boolean;
  solidClass: string;
  onToggle: (id: string) => void;
  disabled?: boolean;
}) {
  if (loading) {
    return <span className="text-xs text-muted-foreground">Memuat…</span>;
  }
  if (classes.length === 0) {
    return (
      <span className="text-xs text-amber-600">
        Kamu belum terdaftar mengajar kelas mana pun. Hubungi admin sekolah dulu.
      </span>
    );
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      {classes.map((c) => {
        const active = selectedIds.includes(c.id);
        return (
          <button
            key={c.id}
            type="button"
            disabled={disabled}
            onClick={() => onToggle(c.id)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-60 ${active ? `${solidClass} text-white` : "border border-input bg-background text-muted-foreground hover:bg-muted"}`}
          >
            {c.name}
          </button>
        );
      })}
    </div>
  );
}