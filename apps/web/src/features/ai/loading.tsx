"use client";

import { LOADING_PATTERNS } from "@/lib/constants";
import { useElapsed } from "@/hooks/use-elapsed";

function LoaderGrid({ delays, dur, round }: { delays: (number | null)[]; dur: number; round: boolean }) {
  return (
    <span aria-hidden className="grid shrink-0 grid-cols-[repeat(3,4px)] gap-[1.5px]">
      {delays.map((delay, i) => (
        <span key={i} className={`size-[4px] bg-neutral-800 ${round ? "rounded-full" : "rounded-[1px]"}`} style={{ opacity: delay === null ? 0.07 : 0.15, animation: delay === null ? "none" : `pixel-on ${dur}ms ease-in-out ${delay}ms infinite` }} />
      ))}
    </span>
  );
}

export default function Loading({ label, variant = "Drive" }: { label?: string; variant?: string }) {
  const elapsed = useElapsed();
  const { delays, dur, round } = LOADING_PATTERNS[variant] ?? LOADING_PATTERNS.Drive;
  return (
    <div role="status" className="flex w-fit items-center gap-2.5">
      <LoaderGrid delays={delays} dur={dur} round={round} />
      <span className="bg-clip-text text-[13px] font-medium text-transparent" style={{ backgroundImage: "linear-gradient(90deg, #a3a3a3 35%, black 50%, #a3a3a3 65%)", backgroundSize: "200% 100%", animation: "shimmer 1.4s linear infinite" }}>{label ?? "Churning"}</span>
      <span className="font-mono text-[12px] text-neutral-500 tabular-nums">{elapsed}</span>
    </div>
  );
}
