'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowDown01Icon, ArrowUp01Icon, Tick02Icon } from '@hugeicons/core-free-icons';
import { createShader, playSweep, accentChain, ACCENTS } from 'glimm';
import { AI_MODELS } from '@/lib/constants';

const RAINBOW = accentChain([ACCENTS.red, ACCENTS.orange, ACCENTS.yellow, ACCENTS.green, ACCENTS.cyan, ACCENTS.blue, ACCENTS.purple]);

export default function PromptBar({
  placeholder,
  onSend,
  models,
  currentModel,
  onModelChange,
}: {
  placeholder?: string;
  onSend?: (text: string) => void;
  models?: { key: string; name: string; tag: string }[];
  currentModel?: string;
  onModelChange?: (model: string) => void;
}) {
  const MODELS = models ?? AI_MODELS;
  const [draft, setDraft] = useState('');
  const [modelOpen, setModelOpen] = useState(false);
  const [model, setModel] = useState(MODELS[0]);
  const [modelHovered, setModelHovered] = useState<number | null>(null);
  const [modelBox, setModelBox] = useState<{ top: number; height: number } | null>(null);
  const [modelMenuLeft, setModelMenuLeft] = useState(0);
  const [modelMenuBottom, setModelMenuBottom] = useState(0);
  const [expanded, setExpanded] = useState(false);

  const composerAnchorRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const measureRef = useRef<HTMLSpanElement>(null);
  const modelRef = useRef<HTMLButtonElement>(null);
  const modelRowRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const glimmRef = useRef<HTMLCanvasElement>(null);
  const shaderRef = useRef<{ destroy: () => void } | null>(null);
  const sweepingRef = useRef(false);

  const [prevCurrentModel, setPrevCurrentModel] = useState(currentModel);
  if (prevCurrentModel !== currentModel) {
    setPrevCurrentModel(currentModel);
    if (currentModel) {
      const found = MODELS.find((m) => m.key === currentModel || m.name === currentModel);
      if (found) setModel(found);
    }
  }

  const makeShader = () => {
    const canvas = glimmRef.current;
    if (!canvas) return null;
    const random = Math.random;
    Math.random = () => 0;
    try {
      return createShader({ canvas, palette: RAINBOW, direction: 'ltr', bandTight: 10, swellAmount: 0.85 });
    } finally {
      Math.random = random;
    }
  };

  useEffect(() => {
    shaderRef.current = makeShader();
    return () => {
      shaderRef.current?.destroy();
      shaderRef.current = null;
    };
  }, []);

  const celebrate = () => {
    if (sweepingRef.current) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    shaderRef.current?.destroy();
    const shader = makeShader();
    shaderRef.current = shader;
    if (!shader) return;
    sweepingRef.current = true;
    const sweep = playSweep(shader, {
      palette: RAINBOW,
      direction: 'ltr',
      sweepMs: 570,
      outroMs: 80,
      peakAlpha: 1.3,
      bandTight: 10,
      brightness: 1.4,
      swellAmount: 1,
      waveSpeed: 1.8,
      easing: 'easeOutExpo',
    });
    sweep.done.finally(() => { sweepingRef.current = false; });
  };

  const modelIndex = MODELS.findIndex((m) => m.key === model.key);

  useLayoutEffect(() => {
    if (!modelOpen) return;
    const t = modelRowRefs.current[modelHovered ?? modelIndex];
    if (t) setModelBox({ top: t.offsetTop, height: t.offsetHeight });
  }, [modelOpen, modelHovered, modelIndex]);

  useLayoutEffect(() => {
    if (!modelOpen || !composerAnchorRef.current || !modelRef.current) return;
    const a = composerAnchorRef.current.getBoundingClientRect();
    const r = modelRef.current.getBoundingClientRect();
    setModelMenuLeft(Math.max(0, Math.min(r.left - a.left, a.width - 176)));
    setModelMenuBottom(a.bottom - r.top + 8);
  }, [modelOpen, model.name]);

  useEffect(() => {
    if (!modelOpen) setModelHovered(null);
  }, [modelOpen]);

  useEffect(() => {
    if (!modelOpen) return;
    const close = (e: PointerEvent) => {
      if (!(e.target as Element).closest('[data-promptbar]')) setModelOpen(false);
    };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, [modelOpen]);

  const selectModel = (next: { key: string; name: string; tag: string }) => {
    setModel(next);
    setModelOpen(false);
    onModelChange?.(next.key);
    if (next.key === 'sprinkles-5') celebrate();
  };

  useLayoutEffect(() => {
    const input = inputRef.current;
    const controls = controlsRef.current;
    const measure = measureRef.current;
    const modelButton = modelRef.current;
    if (!input || !controls || !measure || !modelButton) return;
    const fixed = 28 + modelButton.offsetWidth;
    const gaps = 4 * 2;
    const inline = controls.clientWidth - fixed - gaps;
    const need = draft.includes('\n') || measure.offsetWidth + 8 > inline;
    if (need !== expanded) setExpanded(need);
    const min = 28, max = 100;
    input.style.height = '0px';
    const h = input.scrollHeight;
    input.style.height = `${Math.min(Math.max(h, min), max)}px`;
    input.style.overflowY = h > max ? 'auto' : 'hidden';
  }, [draft, expanded]);

  const canSend = draft.trim().length > 0;
  const wide = expanded;

  const send = () => {
    if (!canSend) return;
    onSend?.(draft.trim());
    setDraft('');
    setModelOpen(false);
  };

  return (
    <div data-promptbar className="w-full">
      <div ref={composerAnchorRef} className="relative">
        {modelOpen && (
          <div
            className="absolute z-10 w-44 rounded-[10px] bg-white p-1 shadow-lg border"
            style={{ left: modelMenuLeft, bottom: modelMenuBottom }}
          >
            <span
              aria-hidden
              className="pointer-events-none absolute inset-x-1 rounded-[6px] bg-neutral-100"
              style={{
                top: modelBox?.top ?? 0,
                height: modelBox?.height ?? 0,
                opacity: modelBox && modelHovered !== null ? 1 : 0,
                transition: 'top 220ms, height 220ms, opacity 150ms',
              }}
            />
            {MODELS.map((m, i) => (
              <button
                key={m.key}
                type="button"
                ref={(el) => { modelRowRefs.current[i] = el; }}
                onMouseDown={(e) => e.preventDefault()}
                onMouseEnter={() => setModelHovered(i)}
                onClick={() => { selectModel(m); inputRef.current?.focus(); }}
                className="relative z-10 flex h-7.5 w-full items-center gap-2 rounded-[6px] px-2 text-left"
              >
                <span className="min-w-0 flex-1 truncate text-[12.5px] font-medium">{m.name}</span>
                <span className="shrink-0 text-[11px] text-neutral-500">{m.tag}</span>
                <span className={`shrink-0 ${m.key === model.key ? '' : 'invisible'}`}>
                  <HugeiconsIcon icon={Tick02Icon} size={13} strokeWidth={2.5} />
                </span>
              </button>
            ))}
          </div>
        )}

        <div className="relative isolate flex flex-col overflow-hidden border bg-white shadow-sm transition-[border-color,border-radius] duration-150 focus-within:border-neutral-400 gap-1.5 p-1.5 rounded-[14px]">
          <canvas
            ref={glimmRef}
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -z-10 h-full w-full"
            style={{ borderRadius: 'inherit' }}
          />
          <span
            ref={measureRef}
            aria-hidden="true"
            className="pointer-events-none absolute invisible whitespace-pre text-[13px] leading-[18px]"
          >
            {draft}
          </span>

          <div
            ref={controlsRef}
            className={`grid items-end gap-x-1 gap-y-1.5 ${
              wide
                ? 'grid-cols-[minmax(0,1fr)_auto_28px]'
                : 'grid-cols-[minmax(0,1fr)_auto_28px]'
            }`}
          >
            <textarea
              ref={inputRef}
              rows={1}
              value={draft}
              onChange={(e) => { setDraft(e.target.value); }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  send();
                }
              }}
              placeholder={placeholder ?? 'Write a message\u2026'}
              aria-label="Prompt"
              className={`min-h-7 px-1 py-[5px] text-[13px] leading-[18px] min-w-0 w-full resize-none bg-transparent outline-none placeholder:text-neutral-400 ${
                wide ? 'col-span-full col-start-1 row-start-1' : 'col-start-1 row-start-1'
              }`}
            />
            <button
              ref={modelRef}
              type="button"
              aria-expanded={modelOpen}
              onClick={() => setModelOpen((c) => !c)}
              className={`flex h-7 shrink-0 items-center gap-1 px-1.5 text-[12px] font-medium hover:bg-neutral-100 rounded-[8px] ${
                wide ? 'col-start-2 row-start-2 justify-self-start' : 'col-start-2 row-start-1'
              }`}
            >
              {model.name}
              <span className="text-neutral-500">
                <HugeiconsIcon icon={ArrowDown01Icon} size={11} strokeWidth={2.4} />
              </span>
            </button>
            <button
              type="button"
              aria-label="Send"
              disabled={!canSend}
              onClick={send}
              className={`flex size-7 shrink-0 items-center justify-center enabled:active:scale-[0.94] rounded-[8px] ${
                wide ? 'col-start-3 row-start-2' : 'col-start-3 row-start-1'
              }`}
              style={{ background: canSend ? 'black' : '#e5e5e5', color: canSend ? 'white' : '#737373' }}
            >
              <HugeiconsIcon icon={ArrowUp01Icon} size={16} strokeWidth={2.4} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}