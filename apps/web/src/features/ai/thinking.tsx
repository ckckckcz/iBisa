"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowDown01Icon, SparklesIcon, Tick02Icon } from "@hugeicons/core-free-icons";
import type { ThinkingRow } from "@/types/ai";
import { THINKING_CONFIG } from "@/lib/constants";
import { useSequence } from "@/hooks/use-sequence";

export default function Thinking({ variant = "Steps", thinking, onSettled, steps }: { variant?: string; thinking?: boolean; onSettled?: () => void; steps?: string[] }) {
  const shouldRun = thinking ?? true;
  const seq = useSequence(THINKING_CONFIG.STAGES);
  const stage = shouldRun ? seq : 4;
  const [manualExpanded, setManualExpanded] = useState<boolean | null>(null);
  const base = steps?.length ? { active: "Berpikir", done: "Selesai berpikir", rows: steps.map((primary) => ({ primary })) } : (THINKING_CONFIG.VARIANTS[variant] ?? THINKING_CONFIG.VARIANTS.Steps);
  const autoExpanded = stage >= 1 && stage < 4;
  const expanded = manualExpanded ?? autoExpanded;
  const working = stage < 3;
  const visible = stage < 2 ? 0 : stage === 2 ? Math.min(2, base.rows.length) : base.rows.length;
  const traceRef = useRef<HTMLDivElement>(null);
  const [lineHeight, setLineHeight] = useState(0);
  useLayoutEffect(() => { if (traceRef.current) setLineHeight(traceRef.current.offsetHeight); }, [visible, expanded, stage]);
  const settledRef = useRef(false);
  useEffect(() => { if (working || settledRef.current) return; settledRef.current = true; onSettled?.(); }, [working, onSettled]);

  return (
    <div className="flex w-full max-w-95 flex-col" style={{ minHeight: working || expanded ? 176 : undefined, transition: "min-height 400ms" }}>
      <button type="button" aria-expanded={expanded} onClick={() => setManualExpanded((c) => !(c ?? autoExpanded))} className="-mx-1.5 flex w-fit items-center gap-2 rounded px-1.5 py-1 hover:bg-neutral-100">
        <HugeiconsIcon icon={SparklesIcon} size={16} className={working ? "text-neutral-500" : "text-neutral-400"} />
        <span className="text-[13px] font-medium whitespace-nowrap" style={working ? { backgroundImage: "linear-gradient(90deg, #a3a3a3 35%, black 50%, #a3a3a3 65%)", backgroundSize: "200% 100%", WebkitBackgroundClip: "text", color: "transparent", animation: "shimmer 1.4s linear infinite" } : { color: "#737373" }}>{working ? base.active : base.done}</span>
        <HugeiconsIcon icon={ArrowDown01Icon} size={14} strokeWidth={2.2} className="text-neutral-400" style={{ transform: expanded ? "rotate(180deg)" : "rotate(0)", transition: "transform 300ms" }} />
      </button>
      <div className="grid transition-[grid-template-rows,opacity] duration-300" style={{ gridTemplateRows: expanded ? "1fr" : "0fr", opacity: expanded ? 1 : 0 }}>
        <div className="overflow-hidden">
          <div className="relative mt-1 ml-1.25 pl-4">
            <span aria-hidden className="absolute left-0.75 w-px bg-neutral-200" style={{ top: -8, height: lineHeight ? lineHeight - 2 : 0 }} />
            <div ref={traceRef} className="flex flex-col gap-1 py-1">
              {base.rows.slice(0, visible).map((row: ThinkingRow, i: number) => (
                <div key={row.primary} className="flex min-h-7 items-center gap-2 rounded-[6px] px-1.5 py-0.5">
                  {i < visible - 1 || !working ? <HugeiconsIcon icon={Tick02Icon} size={14} strokeWidth={2.5} className="text-neutral-400" /> : <span className="size-3 rounded-full border-[1.5px] border-neutral-300 border-t-neutral-500 animate-spin" />}
                  <span className="text-[12.5px] font-medium">{row.primary}</span>
                  {row.secondary && <span className="text-[11.5px] text-neutral-500">{row.secondary}</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
