"use client";

import Image from "next/image";
import { AI_CHAT_EXAMPLES } from "@/lib/constants";
import PromptBar, { type SlashMode } from "@/features/ai/prompt-bar";

export default function EmptyState({
  onSend,
  model,
  onModelChange,
  models,
  modes,
}: {
  onSend: (text: string) => void;
  model: string;
  onModelChange: (model: string) => void;
  models: { key: string; name: string; tag: string }[];
  modes?: SlashMode[];
}) {
  return (
    <div className="relative flex flex-1 flex-col items-center justify-center overflow-hidden px-4 py-16">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 45% 40% at 50% 38%, rgb(147 197 253 / 0.55) 0%, rgb(219 234 254 / 0.25) 55%, transparent 75%)",
        }}
      />
      <div className="relative w-full max-w-2xl">
        <div className="flex items-center justify-center gap-3">
          <Image
            src="/logo1.png"
            alt="Logo AI BISA"
            width={40}
            height={40}
            className="h-9 w-9 object-contain"
            priority
          />
          <h2 className="text-center text-xl font-semibold text-neutral-900">
            Ada yang bisa saya bantu?
          </h2>
        </div>

        <div className="mt-6">
          <PromptBar
            placeholder="Tanya AI..."
            onSend={onSend}
            currentModel={model}
            onModelChange={onModelChange}
            models={models}
            modes={modes}
          />
        </div>

        <p className="mt-5 text-xs font-medium text-neutral-500">
          Contoh pertanyaan:
        </p>
        <div className="mt-2 flex flex-col items-start gap-1.5">
          {modes?.map((m) => (
            <button
              key={m.prefix}
              type="button"
              onClick={() => onSend(`${m.prefix} `)}
              className="group flex max-w-full items-center gap-1 rounded-full border border-blue-200 bg-blue-50/80 px-3 py-1.5 text-xs font-medium text-blue-700 shadow-sm transition-colors hover:border-blue-300"
            >
              <span className="truncate">{m.prefix} — {m.label.toLowerCase()}</span>
              <span
                aria-hidden="true"
                className="shrink-0 text-blue-400 transition-transform group-hover:translate-x-0.5"
              >
                ›
              </span>
            </button>
          ))}
          {AI_CHAT_EXAMPLES.map((example) => (
            <button
              key={example}
              type="button"
              onClick={() => onSend(example)}
              className="group flex max-w-full items-center gap-1 rounded-full border border-neutral-200 bg-white/80 px-3 py-1.5 text-xs text-neutral-600 shadow-sm transition-colors hover:border-neutral-300 hover:text-neutral-900"
            >
              <span className="truncate">{example}</span>
              <span
                aria-hidden="true"
                className="shrink-0 text-neutral-400 transition-transform group-hover:translate-x-0.5"
              >
                ›
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
