'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { Add01Icon, ArrowDown01Icon, ArrowUp01Icon, Cancel01Icon, Refresh01Icon, Tick02Icon } from '@hugeicons/core-free-icons';
import { createShader, playSweep, accentChain, ACCENTS } from 'glimm';
import { AI_MODELS } from '@/lib/constants';
import { ATTACH_ACCEPT, ATTACH_LIMITS, extractFile, type Attachment } from '@/lib/attachments';

const RAINBOW = accentChain([ACCENTS.red, ACCENTS.orange, ACCENTS.yellow, ACCENTS.green, ACCENTS.cyan, ACCENTS.blue, ACCENTS.purple]);

function Glyph({ children, size = 15 }: { children: React.ReactNode; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  );
}

const GLYPHS: Record<string, React.ReactNode> = {
  clip: <path d="m21.4 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" />,
  mic: <g><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v3" /></g>,
};

type Source = { key: string; name: string; desc: string; glyph?: string; attach?: boolean; template?: string };
type Command = { key: string; name: string; desc: string; template: string };

const SOURCES: Source[] = [
  { key: 'attach', name: 'Tambah foto & file', desc: 'Gambar, PDF, DOCX dari perangkat', glyph: 'clip', attach: true },
  { key: 'jadwal', name: 'Template jadwal piket', desc: 'Tempel contoh permintaan jadwal', template: 'Buatkan jadwal piket kelas 5 minggu ini' },
  { key: 'materi', name: 'Template rangkum materi', desc: 'Tempel contoh permintaan materi', template: 'Rangkum materi pecahan untuk siswa kelas 4' },
  { key: 'surat', name: 'Template surat undangan', desc: 'Tempel contoh permintaan surat', template: 'Buatkan draft surat undangan rapat orang tua' },
];

const COMMANDS: Command[] = [
  { key: 'jadwal', name: '/jadwal', desc: 'Minta jadwal piket kelas', template: 'Buatkan jadwal piket kelas 5 minggu ini' },
  { key: 'materi', name: '/materi', desc: 'Rangkum materi untuk siswa', template: 'Rangkum materi pecahan untuk siswa kelas 4' },
  { key: 'surat', name: '/surat', desc: 'Buatkan draf surat sekolah', template: 'Buatkan draft surat undangan rapat orang tua' },
  { key: 'ringkas', name: '/ringkas', desc: 'Ringkas teks di bawah ini', template: 'Ringkas teks berikut:\n' },
];

function parseToken(draft: string): { kind: 'at' | 'slash'; query: string; start: number } | null {
  const match = /(^|\s)([@/])([\w-]*)$/.exec(draft);
  if (!match) return null;
  return { kind: match[2] === '@' ? 'at' : 'slash', query: match[3].toLowerCase(), start: match.index + match[1].length };
}

interface SpeechRecognitionInstance {
  lang: string;
  onresult: ((ev: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start(): void;
  stop(): void;
}

function getSpeechRecognition(): (new () => SpeechRecognitionInstance) | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

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
  const MODELS = models ?? AI_MODELS;
  const [draft, setDraft] = useState('');
  const [dismissed, setDismissed] = useState(false);
  const [plusOpen, setPlusOpen] = useState(false);
  const [modelOpen, setModelOpen] = useState(false);
  const [model, setModel] = useState(MODELS[0]);
  const [active, setActive] = useState(0);
  const [listening, setListening] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const wide = expanded;

  type Picked = { id: string; fileName: string; file: File; status: 'loading' | 'ready' | 'error'; error?: string; attachment?: Attachment };
  const [picked, setPicked] = useState<Picked[]>([]);
  const [attachError, setAttachError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  /** potong tengah biar ekstensi selalu kelihatan: 23417202…Fahmi.pdf */
  function shortName(name: string): string {
    if (name.length <= 28) return name;
    return `${name.slice(0, 12)}…${name.slice(-12)}`;
  }

  function kindBadge(name: string): { label: string; className: string } {
    const ext = (name.split('.').pop() ?? '').toLowerCase();
    if (ext === 'pdf') return { label: 'PDF', className: 'bg-red-100 text-red-700' };
    if (ext === 'docx' || ext === 'doc') return { label: 'DOC', className: 'bg-blue-100 text-blue-700' };
    return { label: ext.toUpperCase().slice(0, 4) || 'FILE', className: 'bg-neutral-200 text-neutral-600' };
  }

  async function runExtract(id: string, file: File) {
    try {
      const attachment = await extractFile(file);
      setPicked((c) => c.map((p) => (p.id === id ? { ...p, status: 'ready' as const, attachment } : p)));
    } catch (e) {
      setPicked((c) => c.map((p) => (p.id === id ? { ...p, status: 'error' as const, error: e instanceof Error ? e.message : 'Gagal membaca file.' } : p)));
    }
  }

  const [rowBox, setRowBox] = useState<{ top: number; height: number } | null>(null);
  const [engaged, setEngaged] = useState(false);
  const [modelBox, setModelBox] = useState<{ top: number; height: number } | null>(null);
  const [modelHovered, setModelHovered] = useState<number | null>(null);
  const [modelMenuLeft, setModelMenuLeft] = useState(0);
  const [modelMenuBottom, setModelMenuBottom] = useState(0);
  const composerAnchorRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const measureRef = useRef<HTMLSpanElement>(null);
  const modelRef = useRef<HTMLButtonElement>(null);
  const rowRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const modelRowRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const glimmRef = useRef<HTMLCanvasElement>(null);
  const shaderRef = useRef<{ destroy: () => void } | null>(null);
  const sweepingRef = useRef(false);
  const recogRef = useRef<SpeechRecognitionInstance | null>(null);
  const [speechSupported] = useState(() => getSpeechRecognition() !== null);

  const [prevCurrentModel, setPrevCurrentModel] = useState(currentModel);
  if (prevCurrentModel !== currentModel) {
    setPrevCurrentModel(currentModel);
    if (currentModel) {
      const found = MODELS.find((m) => m.key === currentModel || m.name === currentModel);
      if (found) setModel(found);
    }
  }

  const token = dismissed ? null : parseToken(draft);
  const menu: 'at' | 'slash' | null = plusOpen ? 'at' : token?.kind ?? null;
  const query = plusOpen ? '' : token?.query ?? '';
  const rows: (Source | Command)[] =
    menu === 'at'
      ? SOURCES.filter((s) => s.name.toLowerCase().includes(query))
      : menu === 'slash'
        ? COMMANDS.filter((c) => c.name.slice(1).startsWith(query))
        : [];

  useEffect(() => { setActive(0); setEngaged(false); }, [menu, query]);
  useLayoutEffect(() => {
    const t = rowRefs.current[active];
    if (t) setRowBox({ top: t.offsetTop, height: t.offsetHeight });
  }, [menu, query, active, rows.length]);

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
  }, [modelOpen, wide, model.name]);
  useEffect(() => { if (!modelOpen) setModelHovered(null); }, [modelOpen]);
  useEffect(() => {
    if (!modelOpen && !plusOpen) return;
    const close = (e: PointerEvent) => {
      if (!(e.target as Element).closest('[data-promptbar]')) { setModelOpen(false); setPlusOpen(false); }
    };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, [modelOpen, plusOpen]);

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
    return () => { shaderRef.current?.destroy(); shaderRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const celebrate = () => {
    if (sweepingRef.current) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    shaderRef.current?.destroy();
    const shader = makeShader();
    shaderRef.current = shader;
    if (!shader) return;
    sweepingRef.current = true;
    const sweep = playSweep(shader, { palette: RAINBOW, direction: 'ltr', sweepMs: 570, outroMs: 80, peakAlpha: 1.3, bandTight: 10, brightness: 1.4, swellAmount: 1, waveSpeed: 1.8, easing: 'easeOutExpo' });
    sweep.done.finally(() => { sweepingRef.current = false; });
  };

  useEffect(() => () => { recogRef.current?.stop(); }, []);

  const toggleDictation = () => {
    const SR = getSpeechRecognition();
    if (!SR) return;
    if (listening) { recogRef.current?.stop(); return; }
    const r = new SR();
    r.lang = 'id-ID';
    recogRef.current = r;
    setListening(true);
    r.onresult = (e) => {
      const t = e.results[0]?.[0]?.transcript ?? '';
      if (t) setDraft((c) => (c ? `${c.trimEnd()} ${t}` : t));
    };
    r.onend = () => { setListening(false); recogRef.current = null; inputRef.current?.focus(); };
    r.onerror = () => { setListening(false); recogRef.current = null; };
    r.start();
  };

  const selectModel = (next: { key: string; name: string; tag: string }) => {
    setModel(next);
    setModelOpen(false);
    onModelChange?.(next.key);
  };

  async function pickFiles(list: FileList | null) {
    if (!list?.length) return;
    setAttachError('');
    const room = ATTACH_LIMITS.maxFiles - picked.length;
    if (room <= 0) { setAttachError(`Maksimal ${ATTACH_LIMITS.maxFiles} file.`); return; }
    const batch = [...list].slice(0, room);
    if (list.length > room) setAttachError(`Maksimal ${ATTACH_LIMITS.maxFiles} file, sisanya diabaikan.`);
    const entries: Picked[] = batch.map((f) => ({ id: `${Date.now()}-${f.name}`, fileName: f.name, file: f, status: 'loading' as const }));
    setPicked((c) => [...c, ...entries]);
    await Promise.all(batch.map((f, i) => runExtract(entries[i].id, f)));
  }

  const closeMenus = () => { setPlusOpen(false); setModelOpen(false); };

  const pick = (row: Source | Command) => {
    if ('attach' in row && row.attach) {
      if (token) setDraft(draft.slice(0, token.start));
      setPlusOpen(false);
      setDismissed(false);
      fileRef.current?.click();
      return;
    }
    const template = 'template' in row && row.template ? row.template : row.name;
    setDraft(`${token ? draft.slice(0, token.start) : draft}${template} `);
    setPlusOpen(false);
    setDismissed(false);
    inputRef.current?.focus();
  };

  useLayoutEffect(() => {
    const input = inputRef.current;
    const controls = controlsRef.current;
    const measure = measureRef.current;
    const modelButton = modelRef.current;
    if (!input || !controls || !measure || !modelButton) return;
    const fixed = 28 * 3 + 28 + modelButton.offsetWidth;
    const gaps = 4 * 4;
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

  const send = () => {
    if (!canSend || extracting) return;
    onSend?.(draft.trim(), readyFiles.length ? readyFiles : undefined);
    setDraft('');
    setPicked([]);
    setAttachError('');
    closeMenus();
    if (fileRef.current) fileRef.current.value = '';
    celebrate();
  };

  return (
    <div data-promptbar className="w-full">
      <div ref={composerAnchorRef} className="relative">
        {menu && (
          <div className="absolute inset-x-0 bottom-full z-10 mb-2 rounded-[10px] border bg-white p-1 shadow-lg">
            <span aria-hidden className="pointer-events-none absolute inset-x-1 rounded-[6px] bg-neutral-100" style={{ top: rowBox?.top ?? 0, height: rowBox?.height ?? 0, opacity: rowBox && engaged && rows.length > 0 ? 1 : 0, transition: 'top 220ms, height 220ms, opacity 150ms' }} />
            {rows.map((row, i) => (
              <button
                key={row.key}
                type="button"
                ref={(el) => { rowRefs.current[i] = el; }}
                onMouseDown={(e) => e.preventDefault()}
                onMouseEnter={() => { setActive(i); setEngaged(true); }}
                onClick={() => pick(row)}
                className="relative z-10 flex h-9 w-full items-center gap-2.5 rounded-[6px] px-2 text-left"
              >
                <span className="flex size-5 shrink-0 items-center justify-center text-neutral-500">
                  {'glyph' in row && row.glyph ? <Glyph size={15}>{GLYPHS[row.glyph]}</Glyph> : <Glyph size={15}><path d="M9 10l-5 5 5 5" /><path d="M20 4v7a4 4 0 0 1-4 4H4" /></Glyph>}
                </span>
                <span className="shrink-0 text-[12.5px] font-medium text-neutral-900">{row.name}</span>
                <span className="min-w-0 flex-1 truncate text-[12px] text-neutral-500">{row.desc}</span>
              </button>
            ))}
            {rows.length === 0 && <div className="flex h-9 items-center px-2 text-[12px] text-neutral-500">Tidak ada yang cocok “{query}”</div>}
            <div className="mt-1 border-t border-neutral-200 px-2 pt-1.5 pb-1 text-[11px] text-neutral-500">{menu === 'at' ? 'Ketik untuk cari lampiran & template' : 'Ketik untuk cari perintah'}</div>
          </div>
        )}
        {modelOpen && (
          <div className="absolute z-10 w-44 rounded-[10px] border bg-white p-1 shadow-lg" style={{ left: modelMenuLeft, bottom: modelMenuBottom }}>
            <span aria-hidden className="pointer-events-none absolute inset-x-1 rounded-[6px] bg-neutral-100" style={{ top: modelBox?.top ?? 0, height: modelBox?.height ?? 0, opacity: modelBox && modelHovered !== null ? 1 : 0, transition: 'top 220ms, height 220ms, opacity 150ms' }} />
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
                <span className="min-w-0 flex-1 truncate text-[12.5px] font-medium text-neutral-900">{m.name}</span>
                <span className="shrink-0 text-[11px] text-neutral-500">{m.tag}</span>
                <span className={`shrink-0 text-neutral-900 ${m.key === model.key ? '' : 'invisible'}`}>
                  <HugeiconsIcon icon={Tick02Icon} size={13} strokeWidth={2.5} />
                </span>
              </button>
            ))}
          </div>
        )}

        <div className="relative isolate flex flex-col gap-1.5 overflow-hidden rounded-[14px] border bg-white p-1.5 shadow-sm transition-[border-color,border-radius] duration-150 focus-within:border-neutral-400">
          <canvas ref={glimmRef} aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 h-full w-full" style={{ borderRadius: 'inherit' }} />
          <span ref={measureRef} aria-hidden="true" className="pointer-events-none absolute invisible whitespace-pre text-[13px] leading-[18px]">{draft}</span>

          {picked.length > 0 && (
            <div className="flex flex-wrap gap-1.5 px-0.5 pt-1">
              {picked.map((p) => {
                const badge = kindBadge(p.fileName);
                return (
                  <span key={p.id} title={p.error ?? p.fileName} className={`flex h-7 items-center gap-1.5 rounded-[8px] py-1 pr-1 pl-1.5 text-[11.5px] ${p.status === 'error' ? 'bg-amber-50 text-amber-800' : 'bg-neutral-100 text-neutral-700'}`}>
                    {p.status === 'loading' ? (
                      <span className="size-3.5 animate-spin rounded-full border-[1.5px] border-neutral-300 border-t-neutral-600" />
                    ) : p.attachment?.kind === 'image' ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={`data:${p.attachment.mimeType};base64,${p.attachment.data}`} alt="" className="size-4 rounded-[4px] object-cover" />
                    ) : (
                      <span className={`rounded px-1 text-[9px] font-bold ${badge.className}`}>{badge.label}</span>
                    )}
                    <span className="max-w-36 truncate">{p.status === 'loading' ? `Mengekstrak ${shortName(p.fileName)}…` : shortName(p.fileName)}</span>
                    {p.status === 'error' && (
                      <>
                        <span className="max-w-48 truncate text-[10.5px]">{p.error}</span>
                        <button type="button" aria-label={`Coba lagi ${p.fileName}`} title="Coba lagi" onClick={() => { setPicked((c) => c.map((x) => (x.id === p.id ? { ...x, status: 'loading' as const, error: undefined } : x))); void runExtract(p.id, p.file); }} className="flex size-5 items-center justify-center rounded-[5px] hover:bg-amber-100">
                          <HugeiconsIcon icon={Refresh01Icon} size={12} strokeWidth={2} />
                        </button>
                      </>
                    )}
                    <button type="button" aria-label="Hapus lampiran" onClick={() => setPicked((c) => c.filter((x) => x.id !== p.id))} className="flex size-5 items-center justify-center rounded-[5px] hover:bg-neutral-200">
                      <HugeiconsIcon icon={Cancel01Icon} size={12} strokeWidth={2} />
                    </button>
                  </span>
                );
              })}
            </div>
          )}
          {attachError && <p className="px-1 text-[11px] text-red-600">{attachError}</p>}

          <div ref={controlsRef} className={`grid items-end gap-x-1 gap-y-1.5 ${wide ? 'grid-cols-[28px_auto_minmax(0,1fr)_28px_28px]' : 'grid-cols-[28px_minmax(0,1fr)_auto_28px_28px]'}`}>
            <input ref={fileRef} type="file" multiple accept={ATTACH_ACCEPT} className="hidden" aria-label="Lampirkan file" onChange={(e) => { void pickFiles(e.target.files); e.target.value = ''; }} />
            <button
              type="button"
              aria-label="Tambah lampiran & template"
              aria-expanded={plusOpen}
              onClick={() => { setModelOpen(false); setPlusOpen((c) => !c); inputRef.current?.focus(); }}
              className={`flex size-7 shrink-0 items-center justify-center justify-self-start rounded-[8px] hover:bg-neutral-100 ${plusOpen ? 'bg-neutral-100' : ''} ${wide ? 'col-start-1 row-start-2' : 'col-start-1 row-start-1'}`}
            >
              <HugeiconsIcon icon={Add01Icon} size={16} strokeWidth={2} />
            </button>

            <textarea
              ref={inputRef}
              rows={1}
              value={draft}
              onChange={(e) => { setDraft(e.target.value); setDismissed(false); setPlusOpen(false); }}
              onKeyDown={(e) => {
                if (menu && rows.length > 0) {
                  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                    e.preventDefault();
                    setEngaged(true);
                    setActive((c) => (c + (e.key === 'ArrowDown' ? 1 : rows.length - 1)) % rows.length);
                    return;
                  }
                  if ((e.key === 'Enter' && !e.shiftKey) || e.key === 'Tab') { e.preventDefault(); pick(rows[active]); return; }
                }
                if (e.key === 'Escape') { setDismissed(true); closeMenus(); return; }
                if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); send(); }
              }}
              placeholder={listening ? 'Mendengarkan…' : placeholder ?? 'Tanya AI...'}
              aria-label="Prompt"
              className={`min-h-7 w-full min-w-0 resize-none bg-transparent px-1 py-[5px] text-[13px] leading-[18px] outline-none placeholder:text-neutral-400 ${wide ? 'col-span-full col-start-1 row-start-1' : 'col-start-2 row-start-1'}`}
            />

            <button
              ref={modelRef}
              type="button"
              aria-expanded={modelOpen}
              aria-label="Pilih model"
              onClick={() => { setPlusOpen(false); setModelOpen((c) => !c); }}
              className={`flex h-7 shrink-0 items-center gap-1 rounded-[8px] px-1.5 text-[12px] font-medium hover:bg-neutral-100 ${wide ? 'col-start-2 row-start-2 justify-self-start' : 'col-start-3 row-start-1'}`}
            >
              {model.name}
              <span className="text-neutral-500"><HugeiconsIcon icon={ArrowDown01Icon} size={11} strokeWidth={2.4} /></span>
            </button>

            <button
              type="button"
              aria-label={listening ? 'Berhenti dikte' : 'Mulai dikte'}
              aria-pressed={listening}
              title={speechSupported ? 'Dikte suara (Indonesia)' : 'Dikte tidak didukung browser ini'}
              disabled={!speechSupported}
              onClick={toggleDictation}
              className={`flex size-7 shrink-0 items-center justify-center rounded-[8px] transition-colors ${listening ? 'bg-blue-100 text-blue-600' : 'hover:bg-neutral-100'} ${!speechSupported ? 'opacity-40' : ''} ${wide ? 'col-start-4 row-start-2' : 'col-start-4 row-start-1'}`}
            >
              {listening ? (
                <span className="flex h-3.5 items-center gap-[2.5px]">
                  {[0, 1, 2].map((i) => (
                    <span key={i} className="w-[2.5px] rounded-full bg-current" style={{ height: '100%', animation: `eq-bounce 900ms ease-in-out ${i * 150}ms infinite` }} />
                  ))}
                </span>
              ) : (
                <Glyph size={15}>{GLYPHS.mic}</Glyph>
              )}
            </button>

            <button
              type="button"
              aria-label="Send"
              disabled={!canSend}
              onClick={send}
              className={`flex size-7 shrink-0 items-center justify-center rounded-[8px] enabled:active:scale-[0.94] ${wide ? 'col-start-5 row-start-2' : 'col-start-5 row-start-1'}`}
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
