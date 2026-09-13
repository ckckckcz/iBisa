"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowDown01Icon, ArrowUp01Icon, Cancel01Icon, Tick02Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { RollingDigits } from "@/features/ai/rolling-digits";

import type { ApprovalQuestion } from "@/types/ai";
import { APPROVAL_CARD_ANIMATION } from "@/lib/constants";

export default function ApprovalCard({
  questions,
  onSubmitted,
}: {
  questions: ApprovalQuestion[];
  onSubmitted?: (answers: Record<number, number[]>, summary: string) => void;
}) {
  const [qi, setQi] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number[]>>({});
  const [custom, setCustom] = useState<Record<number, string>>({});
  const [sent, setSent] = useState(false);
  const [open, setOpen] = useState(true);

  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const questionRefs = useRef<(HTMLDivElement | null)[]>([]);
  const measured = useRef(false);
  const [viewportH, setViewportH] = useState<number | undefined>(undefined);
  const [trackY, setTrackY] = useState(0);
  const [animate, setAnimate] = useState(false);

  const last = qi === questions.length - 1;
  const selected = answers[qi] ?? [];
  const hasAnswer = selected.length > 0 || Boolean(custom[qi]?.trim());

  useLayoutEffect(() => {
    const item = questionRefs.current[qi];
    if (!item) return;
    const reduce = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const withAnim = measured.current;
    measured.current = true;
    setViewportH(item.offsetHeight);
    setTrackY(item.offsetTop);
    setAnimate(withAnim && !reduce);
  }, [qi, answers, custom, open, sent]);

  useEffect(() => () => { if (advanceTimer.current) clearTimeout(advanceTimer.current); }, []);

  const goTo = (next: number) => {
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
    setQi(Math.min(Math.max(next, 0), questions.length - 1));
  };

  const summary = () => {
    const parts = questions.map((q, idx) => {
      const picked = (answers[idx] ?? []).map((i) => q.options[i]).filter(Boolean);
      const c = custom[idx]?.trim();
      const all = [...picked, ...(c ? [c] : [])].join(", ");
      return all ? `${q.q} ${all}` : "";
    }).filter(Boolean);
    return parts.length ? `Jawaban saya: ${parts.join(" | ")}` : "Lanjut";
  };

  const send = () => {
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
    setSent(true);
    onSubmitted?.(answers, summary());
  };

  const advance = () => {
    if (last) send();
    else goTo(qi + 1);
  };

  const toggle = (index: number) => {
    const type = questions[qi].type;
    setAnswers((cur) => {
      const picked = cur[qi] ?? [];
      const next = type === "radio" ? [index] : picked.includes(index) ? picked.filter((x) => x !== index) : [...picked, index];
      return { ...cur, [qi]: next };
    });
    if (type === "radio") {
      setCustom((cur) => ({ ...cur, [qi]: "" }));
      if (advanceTimer.current) clearTimeout(advanceTimer.current);
      advanceTimer.current = setTimeout(() => {
        if (last) send();
        else setQi((c) => Math.min(questions.length - 1, c + 1));
      }, 480);
    }
  };

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="rounded-lg bg-white px-3 py-2 text-[12.5px] font-medium shadow-sm transition-colors hover:bg-neutral-100">
        Buka pertanyaan
      </button>
    );
  }

  if (sent) {
    return (
      <div className="flex w-full items-center gap-3" style={{ animation: "pop-in 260ms cubic-bezier(0.23,1,0.32,1) both" }}>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 py-1 pr-2.5 pl-1 text-[12.5px] font-medium text-green-700">
          <span className="flex size-4 items-center justify-center rounded-full bg-green-600 text-white">
            <HugeiconsIcon icon={Tick02Icon} size={11} strokeWidth={3} />
          </span>
          Jawaban terkirim
        </span>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="relative overflow-hidden rounded-xl border bg-white shadow-sm" style={{ animation: "fade-up 380ms cubic-bezier(0.23,1,0.32,1) both" }}>
        <button type="button" aria-label="Tutup" onClick={() => setOpen(false)} className="absolute top-2.5 right-2.5 z-10 flex size-6 items-center justify-center rounded-md text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-900">
          <HugeiconsIcon icon={Cancel01Icon} size={14} strokeWidth={2.2} />
        </button>
        <div className="p-4">
          <div className="overflow-hidden" style={{ height: viewportH, transition: animate ? `height ${APPROVAL_CARD_ANIMATION.SLIDE}` : undefined }} aria-live="polite">
            <div style={{ display: "flex", flexDirection: "column", gap: 26, transform: `translate3d(0, ${-trackY}px, 0)`, transition: animate ? `transform ${APPROVAL_CARD_ANIMATION.SLIDE}` : undefined, willChange: "transform" }}>
              {questions.map((question, qIdx) => {
                const active = qIdx === qi;
                const picked = answers[qIdx] ?? [];
                return (
                  <div
                    key={qIdx}
                    ref={(el) => { questionRefs.current[qIdx] = el; }}
                    aria-hidden={active ? undefined : true}
                    style={{ opacity: active ? 1 : 0, transition: animate ? `opacity ${APPROVAL_CARD_ANIMATION.SLIDE}` : undefined, pointerEvents: active ? undefined : "none" }}
                  >
                    <div className="pr-7 text-[14px] font-medium text-neutral-900">{question.q}</div>
                    <div className="mt-2.5 flex flex-col gap-1">
                      {question.options.map((option, i) => {
                        const on = picked.includes(i);
                        return (
                          <button
                            key={option}
                            type="button"
                            aria-pressed={on}
                            tabIndex={active ? 0 : -1}
                            onClick={() => { if (active) toggle(i); }}
                            className="relative z-10 flex items-center gap-1.5 rounded-lg px-1 py-1 text-left transition-colors hover:bg-neutral-100"
                          >
                            <span className={`flex size-4 shrink-0 items-center justify-center transition-colors duration-200 ${question.type === "radio" ? "rounded-full" : "rounded-[5px]"} ${on ? "bg-neutral-900 text-white" : "shadow-[inset_0_0_0_1.5px_#d4d4d4] text-transparent"}`}>
                              {question.type === "radio" ? (
                                <span className="size-1.5 rounded-full bg-white transition-transform duration-200" style={{ transform: on ? "scale(1)" : "scale(0)" }} />
                              ) : (
                                <HugeiconsIcon icon={Tick02Icon} size={12} strokeWidth={3} />
                              )}
                            </span>
                            <span className={`text-[13px] leading-none transition-colors duration-200 ${on ? "text-neutral-900" : "text-neutral-500"}`}>{option}</span>
                          </button>
                        );
                      })}
                      <label className="relative z-10 flex items-center gap-1.5 rounded-lg px-1 py-1">
                        <input
                          value={custom[qIdx] ?? ""}
                          tabIndex={active ? 0 : -1}
                          onChange={(e) => {
                            if (!active) return;
                            setCustom((cur) => ({ ...cur, [qIdx]: e.target.value }));
                            if (question.type === "radio") setAnswers((cur) => ({ ...cur, [qIdx]: [] }));
                          }}
                          onKeyDown={(e) => { if (e.key === "Enter" && hasAnswer) { e.preventDefault(); advance(); } }}
                          placeholder="Lainnya…"
                          aria-label="Jawaban lain"
                          className="min-w-0 flex-1 bg-transparent pl-1.5 text-[13px] text-neutral-900 outline-none placeholder:text-neutral-400"
                        />
                      </label>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-neutral-100 px-4 py-2.5">
          <div className="flex items-center gap-1 text-neutral-400">
            <button type="button" aria-label="Pertanyaan sebelumnya" disabled={qi <= 0} onClick={() => goTo(qi - 1)} className="flex size-4.5 items-center justify-center rounded-[5px] transition-colors enabled:hover:text-neutral-900 disabled:opacity-30">
              <HugeiconsIcon icon={ArrowUp01Icon} size={14} strokeWidth={2} />
            </button>
            <span className="inline-flex items-center text-[12px] font-medium tabular-nums" style={{ letterSpacing: "-0.1px", lineHeight: 1 }}>
              <RollingDigits value={`${qi + 1} / ${questions.length}`} />
            </span>
            <button type="button" aria-label="Pertanyaan berikutnya" disabled={last} onClick={() => goTo(qi + 1)} className="flex size-4.5 items-center justify-center rounded-[5px] transition-colors enabled:hover:text-neutral-900 disabled:opacity-30">
              <HugeiconsIcon icon={ArrowDown01Icon} size={14} strokeWidth={2} />
            </button>
          </div>
          <div className="-mr-0.5 flex items-center gap-1.5">
            <Button variant="ghost" size="sm" onClick={() => (last ? setOpen(false) : goTo(qi + 1))}>Lewati</Button>
            <Button size="sm" disabled={!hasAnswer} onClick={advance}>{last ? "Kirim ⏎" : "Lanjut ⏎"}</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
