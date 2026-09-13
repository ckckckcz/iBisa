'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { Add01Icon, ArrowDown01Icon, ArrowUp01Icon, Cancel01Icon, Tick02Icon } from '@hugeicons/core-free-icons';
import { createShader, playSweep, accentChain, ACCENTS } from 'glimm';
import { AI_MODELS } from '@/lib/constants';
import { ATTACH_ACCEPT, ATTACH_LIMITS, extractFile, type Attachment } from '@/lib/attachments';

const RAINBOW = accentChain([ACCENTS.red, ACCENTS.orange, ACCENTS.yellow, ACCENTS.green, ACCENTS.cyan, ACCENTS.blue, ACCENTS.purple]);

export default function PromptBar({
  placeholder,
  onSend,
  models,
  currentModel,
  onModelChange,
}: {
  placeholder?: string;
  onSend?: (text: string, files?: Attachment[]) => void;
  models?: { key: string; name: string; tag: string }[];
  currentModel?: string;
  onModelChange?: (model: string) => void;
}) {
  type Picked = { id: string; status: 'loading' | 'ready' | 'error'; error?: string; attachment?: Attachment };
  const [picked, setPicked] = useState<Picked[]>([]);
  const [attachError, setAttachError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  async function pickFiles(list: FileList | null) {
    if (!list?.length) return;
    setAttachError('');
    const room = ATTACH_LIMITS.maxFiles - picked.length;
    if (room <= 0) { setAttachError(`Maksimal ${ATTACH_LIMITS.maxFiles} file.`); return; }
    const batch = [...list].slice(0, room);
    if (list.length > room) setAttachError(`Maksimal ${ATTACH_LIMITS.maxFiles} file, sisanya diabaikan.`);
    const entries: Picked[] = batch.map((f) => ({ id: `${Date.now()}-${f.name}`, status: 'loading' as const }));
    setPicked((c) => [...c, ...entries]);
    await Promise.all(batch.map(async (f, i) => {
      try {
        const attachment = await extractFile(f);
        setPicked((c) => c.map((p) => (p.id === entries[i].id ? { ...p, status: 'ready' as const, attachment } : p)));
      } catch (e) {
        setPicked((c) => c.map((p) => (p.id === entries[i].id ? { ...p, status: 'error' as const, error: e instanceof Error ? e.message : 'Gagal membaca file.' } : p)));
      }
    }));
  }
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
    const fixed = 28 + 28 + modelButton.offsetWidth;
    const gaps = 4 * 3;
    const inline = controls.clientWidth - fixed - gaps;
    const need = draft.includes('\n') || measure.offsetWidth + 8 > inline;
    if (need !== expanded) setExpanded(need);
    const min = 28, max = 100;
    input.style.height = '0px';
    const h = input.scrollHeight;
    input.style.height = `${Math.min(Math.max(h, min), max)}px`;
    input.style.overflowY = h > max ? 'auto' : 'hidden';
  }, [draft, expanded]);

  const readyFiles = picked.filter((p) => p.status === 'ready' && p.attachment).map((p) => p.attachment as Attachment);
  const extracting = picked.some((p) => p.status === 'loading');
  const canSend = draft.trim().length > 0 || (readyFiles.length > 0 && !extracting);
  const wide = expanded;

  const send = () => {
    if (!canSend || extracting) return;
    onSend?.(draft.trim(), readyFiles.length ? readyFiles : undefined);
    setDraft('');
    setPicked([]);
    setAttachError('');
    setModelOpen(false);
    if (fileRef.current) fileRef.current.value = '';
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

          {picked.length > 0 && (
            <div className="flex flex-wrap gap-1.5 px-0.5 pt-1">
              {picked.map((p) => (
                <span key={p.id} title={p.error ?? p.attachment?.name} className={`flex h-7 items-center gap-1.5 rounded-[8px] py-1 pr-1 pl-1.5 text-[11.5px] ${p.status === 'error' ? 'bg-red-50 text-red-600' : 'bg-neutral-100 text-neutral-700'}`}>
                  {p.status === 'loading' ? (
                    <span className="size-3.5 animate-spin rounded-full border-[1.5px] border-neutral-300 border-t-neutral-600" />
                  ) : p.attachment?.kind === 'image' ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={`data:${p.attachment.mimeType};base64,${p.attachment.data}`} alt="" className="size-4 rounded-[4px] object-cover" />
                  ) : (
                    <HugeiconsIcon icon={Add01Icon} size={12} />
                  )}
                  <span className="max-w-36 truncate">{p.attachment?.name ?? 'Memproses…'}</span>
                  {p.status === 'error' && <span className="max-w-48 truncate text-[10.5px]">{p.error}</span>}
                  <button type="button" aria-label="Hapus lampiran" onClick={() => setPicked((c) => c.filter((x) => x.id !== p.id))} className="flex size-5 items-center justify-center rounded-[5px] hover:bg-neutral-200">
                    <HugeiconsIcon icon={Cancel01Icon} size={12} strokeWidth={2} />
                  </button>
                </span>
              ))}
            </div>
          )}
          {attachError && <p className="px-1 text-[11px] text-red-600">{attachError}</p>}

          <div
            ref={controlsRef}
            className="grid items-end gap-x-1 gap-y-1.5 grid-cols-[28px_minmax(0,1fr)_auto_28px]"
          >
            <input ref={fileRef} type="file" multiple accept={ATTACH_ACCEPT} className="hidden" aria-label="Lampirkan file" onChange={(e) => { void pickFiles(e.target.files); e.target.value = ''; }} />
            <button
              type="button"
              aria-label="Lampirkan file"
              title="Lampirkan gambar / PDF / dokumen"
              onClick={() => fileRef.current?.click()}
              className="col-start-1 row-start-1 flex size-7 shrink-0 items-center justify-center justify-self-start rounded-[8px] hover:bg-neutral-100"
            >
              <HugeiconsIcon icon={Add01Icon} size={16} strokeWidth={2} />
            </button>
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
                wide ? 'col-span-full col-start-1 row-start-1' : 'col-start-2 row-start-1'
              }`}
            />
            <button
              ref={modelRef}
              type="button"
              aria-expanded={modelOpen}
              onClick={() => setModelOpen((c) => !c)}
              className={`flex h-7 shrink-0 items-center gap-1 px-1.5 text-[12px] font-medium hover:bg-neutral-100 rounded-[8px] ${
                wide ? 'col-start-2 row-start-2 justify-self-start' : 'col-start-3 row-start-1'
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
                wide ? 'col-start-4 row-start-2' : 'col-start-4 row-start-1'
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