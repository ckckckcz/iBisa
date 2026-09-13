"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon } from "@hugeicons/core-free-icons";
import { SELECTION_ACTIONS } from "@/lib/constants";

export default function SelectableMessage({
  children,
  onAction,
}: {
  children: ReactNode;
  onAction?: (action: string, selected: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState("");

  useEffect(() => {
    const close = (e: PointerEvent) => {
      if (!(e.target as Element).closest("[data-selectbar]") && !(e.target as Element).closest("[data-selectmsg]")) setSelected("");
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, []);

  const onMouseUp = () => {
    const sel = window.getSelection();
    const text = sel?.toString().trim() ?? "";
    if (!sel || !text || text.length < 3 || !ref.current?.contains(sel.anchorNode)) {
      setSelected("");
      return;
    }
    setSelected(text.slice(0, 500));
  };

  return (
    <div data-selectmsg ref={ref} onMouseUp={onMouseUp} className="relative">
      {children}
      {selected && (
        <div
          data-selectbar
          className="absolute -top-2 right-0 z-10 flex h-9 -translate-y-full items-center gap-0.5 rounded-full border border-neutral-200 bg-white p-1 shadow-lg"
          style={{ animation: "pop-in 220ms cubic-bezier(0.23,1,0.32,1) both" }}
        >
          {SELECTION_ACTIONS.map((a) => (
            <button
              key={a.id}
              type="button"
              title={`${a.id} seleksi`}
              onClick={() => { onAction?.(a.id, selected); setSelected(""); window.getSelection()?.removeAllRanges(); }}
              className="flex h-7 shrink-0 items-center gap-1.5 rounded-full px-2.5 text-[12.5px] font-medium text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
            >
              <HugeiconsIcon icon={a.icon} size={14} strokeWidth={1.8} />
              {a.id}
            </button>
          ))}
          <button type="button" aria-label="Tutup" onClick={() => setSelected("")} className="flex size-7 shrink-0 items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-100 hover:text-neutral-900">
            <HugeiconsIcon icon={Cancel01Icon} size={14} strokeWidth={2} />
          </button>
        </div>
      )}
    </div>
  );
}
