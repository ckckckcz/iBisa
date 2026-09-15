"use client";

import { useEffect, useState } from "react";
import Image from "next/image"
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Copy01Icon,
  CornerUpLeftIcon,
  Refresh01Icon,
  ThumbsDownIcon,
  ThumbsUpIcon,
  Tick02Icon,
} from "@hugeicons/core-free-icons";
import type { StreamingSource, StreamingToken } from "@/types/ai";
import Markdown from "@/features/ai/markdown";

import { STREAMING_TIMING } from "@/lib/constants";

export type { StreamingSource, StreamingToken };

function initials(domain: string) {
  return domain.slice(0, 1).toUpperCase();
}

function SourceChip({ source }: { source?: StreamingSource }) {
  if (!source) return null;
  return (
    <a
      href={source.href}
      target="_blank"
      rel="noreferrer"
      className="mr-1 inline-flex h-4.5 translate-y-px items-center gap-1 rounded-[5px] border border-neutral-200 bg-neutral-100 pr-1 pl-0.75 align-middle font-mono text-[10.5px] text-neutral-600 transition-colors hover:bg-neutral-200 hover:text-neutral-900"
      style={{ animation: "pop-in 250ms cubic-bezier(0.23,1,0.32,1) both" }}
    >
      {source.image ? (
        <Image src={source.image} alt="" className="size-3 rounded-[3px]" />
      ) : (
        <span className="flex size-3 items-center justify-center rounded-[3px] bg-neutral-800 text-[8px] font-bold text-white">{initials(source.domain)}</span>
      )}
      <span>{source.domain}</span>
    </a>
  );
}

export default function StreamingText({
  text,
  tokens,
  sources = [],
  followUps = [],
  loop = false,
  animate = true,
  onDone,
  onFollowUp,
  onRetry,
}: {
  text?: string;
  tokens?: StreamingToken[];
  sources?: StreamingSource[];
  followUps?: string[];
  loop?: boolean;
  animate?: boolean;
  onDone?: () => void;
  onFollowUp?: (text: string, index: number) => void;
  onRetry?: () => void;
}) {
  const normalized: StreamingToken[] = tokens ?? (text ? text.split(" ").map((t) => ({ text: t })) : []);
  const fullText = normalized.filter((t) => !t.cite).map((t) => t.text).join(" ");
  const [count, setCount] = useState(animate ? 0 : normalized.length);
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [vote, setVote] = useState<"up" | "down" | null>(null);
  const [prevFullText, setPrevFullText] = useState(fullText);
  const [prevAnimate, setPrevAnimate] = useState(animate);

  if (prevFullText !== fullText || prevAnimate !== animate) {
    setPrevFullText(fullText);
    setPrevAnimate(animate);
    setCount(animate ? 0 : normalized.length);
    setSourcesOpen(false);
    setCopied(false);
    setVote(null);
  }
  const done = count >= normalized.length;

  useEffect(() => {
    if (!animate || normalized.length === 0) return;
    if (done && !loop) { onDone?.(); return; }
    const t = setTimeout(() => setCount((c) => (c >= normalized.length ? 0 : c + 1)), done ? STREAMING_TIMING.HOLD_MS : STREAMING_TIMING.WORD_MS);
    return () => clearTimeout(t);
  }, [animate, count, done, loop, normalized.length, onDone]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(fullText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* skip */ }
  }

  if (normalized.length === 0) return null;
  return (
    <div className="w-full">
      {done ? (
        <Markdown text={fullText} />
      ) : (
        <p className="text-[13px] leading-relaxed text-neutral-900">
          {normalized.slice(0, count).map((token, i) =>
            token.cite ? (
              <SourceChip key={i} source={sources[0]} />
            ) : (
              <span key={i} className="inline" style={{ animation: "word-in 300ms ease-out both" }}>
                {token.text}{" "}
              </span>
            ),
          )}
          <span className="ml-0.5 inline-block h-3 w-0.5 translate-y-0.5 rounded-full bg-neutral-900" style={{ animation: "fade-in 150ms ease-out both" }} />
        </p>
      )}

      <div className="mt-2 flex items-center gap-0.5 transition-opacity duration-300" style={{ opacity: done ? 1 : 0, pointerEvents: done ? "auto" : "none" }}>
        <button type="button" aria-label={copied ? "Tersalin" : "Salin"} title={copied ? "Tersalin" : "Salin"} onClick={copy} className="flex size-6 items-center justify-center rounded-[6px] text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900">
          {copied ? (
            <HugeiconsIcon icon={Tick02Icon} size={15} strokeWidth={2} />
          ) : (
            <HugeiconsIcon icon={Copy01Icon} size={15} strokeWidth={1.8} />
          )}
        </button>
        {onRetry && (
          <button type="button" aria-label="Coba lagi" title="Coba lagi" onClick={onRetry} className="flex size-6 items-center justify-center rounded-[6px] text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900">
            <HugeiconsIcon icon={Refresh01Icon} size={15} strokeWidth={1.8} />
          </button>
        )}
        <button type="button" aria-label="Bagus" title="Bagus" aria-pressed={vote === "up"} onClick={() => setVote((v) => (v === "up" ? null : "up"))} className={`flex size-6 items-center justify-center rounded-[6px] transition-colors hover:bg-neutral-100 ${vote === "up" ? "text-neutral-900" : "text-neutral-500 hover:text-neutral-900"}`}>
          <HugeiconsIcon icon={ThumbsUpIcon} size={15} strokeWidth={1.8} className={vote === "up" ? "fill-current" : ""} />
        </button>
        <button type="button" aria-label="Kurang" title="Kurang" aria-pressed={vote === "down"} onClick={() => setVote((v) => (v === "down" ? null : "down"))} className={`flex size-6 items-center justify-center rounded-[6px] transition-colors hover:bg-neutral-100 ${vote === "down" ? "text-neutral-900" : "text-neutral-500 hover:text-neutral-900"}`}>
          <HugeiconsIcon icon={ThumbsDownIcon} size={15} strokeWidth={1.8} className={vote === "down" ? "fill-current" : ""} />
        </button>
        {sources.length > 0 && (
          <button type="button" aria-expanded={sourcesOpen} onClick={() => setSourcesOpen((c) => !c)} className="ml-1.5 flex items-center gap-1.5 rounded-[6px] px-1 py-0.5 text-left transition-colors hover:bg-neutral-100">
            <span className="flex -space-x-1">
              {sources.map((s) => (
                s.image ? <Image key={s.domain} src={s.image} alt="" className="size-3.5 rounded-full bg-white shadow-[0_0_0_1.5px_white]" />
                : <span key={s.domain} className="flex size-3.5 items-center justify-center rounded-full bg-neutral-800 text-[8px] font-bold text-white shadow-[0_0_0_1.5px_white]">{initials(s.domain)}</span>
              ))}
            </span>
            <span className="text-[12px] text-neutral-500">{sources.length} sources</span>
          </button>
        )}
      </div>

      {sources.length > 0 && (
        <div className="grid transition-[grid-template-rows,opacity] duration-300" style={{ gridTemplateRows: done && sourcesOpen ? "1fr" : "0fr", opacity: done && sourcesOpen ? 1 : 0 }}>
          <div className="overflow-hidden">
            <div className="mt-1.5 flex flex-col rounded-[10px] border border-neutral-200 bg-neutral-50 p-1">
              {sources.map((s) => (
                <a key={s.domain} href={s.href} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-[6px] px-1.5 py-1 text-[12px] text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900">
                  {s.image ? <Image src={s.image} alt="" className="size-4 rounded-lg" /> : <span className="flex size-4 items-center justify-center rounded-lg bg-neutral-800 text-[9px] font-bold text-white">{initials(s.domain)}</span>}
                  <span className="underline-offset-2 hover:underline">{s.name}</span>
                  <span className="ml-auto font-mono text-[10.5px] text-neutral-400">{s.domain}</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      )}

      {followUps.length > 0 && (
        <div className="mt-2.5 transition-opacity duration-300" style={{ opacity: done ? 1 : 0, pointerEvents: done ? "auto" : "none" }}>
          <p className="text-[12px] font-medium text-neutral-500">Follow-ups</p>
          <div className="mt-0.5 flex flex-col">
            {followUps.map((f, i) => (
              <button key={f} onClick={() => onFollowUp?.(f, i)} className="-mx-1.5 flex items-center gap-2 rounded-[7px] border-b border-neutral-100 px-1.5 py-1.5 text-left text-[12.5px] text-neutral-900 transition-colors hover:bg-neutral-100"
                style={done ? { animation: `fade-up 350ms cubic-bezier(0.23,1,0.32,1) ${i * 90}ms both` } : { opacity: 0 }}>
                <HugeiconsIcon icon={CornerUpLeftIcon} size={11} strokeWidth={2} className="shrink-0 text-neutral-400" />
                {f}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
