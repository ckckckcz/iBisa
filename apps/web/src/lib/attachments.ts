export type Attachment =
  | { kind: 'image'; name: string; mimeType: string; data: string }
  | { kind: 'text'; name: string; text: string };

export type AttachmentMeta = { kind: 'image' | 'text'; name: string };

export const ATTACH_LIMITS = {
  maxFiles: 3,
  maxBytes: 5 * 1024 * 1024,
  maxPdfPages: 20,
  maxChars: 30000,
} as const;

export const ATTACH_ACCEPT =
  '.png,.jpg,.jpeg,.gif,.webp,.txt,.csv,.md,.markdown,.pdf,.docx,image/png,image/jpeg,image/gif,image/webp';

const IMAGE_MIMES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const TEXT_EXTS = ['txt', 'csv', 'md', 'markdown'];

function extOf(name: string): string {
  return name.split('.').pop()?.toLowerCase() ?? '';
}

function trimText(s: string): string {
  const t = s.replace(/\r/g, '').trim();
  if (t.length <= ATTACH_LIMITS.maxChars) return t;
  return t.slice(0, ATTACH_LIMITS.maxChars) + '\n\n[dipotong: teks terlalu panjang]';
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(new Error('Gagal membaca file.'));
    r.readAsDataURL(file);
  });
}

async function extractPdf(file: File): Promise<string> {

  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const buf = await file.arrayBuffer();
  const doc = await pdfjs.getDocument({ data: buf }).promise;
  const pages: string[] = [];
  const n = Math.min(doc.numPages, ATTACH_LIMITS.maxPdfPages);
  for (let i = 1; i <= n; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    pages.push(content.items.map((it) => ('str' in it ? (it.str as string) : '')).join(' '));
  }
  const note = doc.numPages > n ? `\n\n[hanya ${n} dari ${doc.numPages} halaman dibaca]` : '';
  return trimText(pages.join('\n\n')) + note;
}

async function extractDocx(file: File): Promise<string> {
  const mammoth = await import('mammoth');
  const buf = await file.arrayBuffer();
  const out = await mammoth.extractRawText({ arrayBuffer: buf });
  return trimText(out.value);
}

export async function extractFile(file: File): Promise<Attachment> {
  if (file.size > ATTACH_LIMITS.maxBytes) {
    throw new Error(`"${file.name}" melebihi 5MB.`);
  }
  const ext = extOf(file.name);
  if (IMAGE_MIMES.includes(file.type)) {
    const url = await fileToDataUrl(file);
    return { kind: 'image', name: file.name, mimeType: file.type, data: url.split(',')[1] ?? '' };
  }
  if (ext === 'pdf' || file.type === 'application/pdf') {
    return { kind: 'text', name: file.name, text: await extractPdf(file) };
  }
  if (ext === 'docx') {
    return { kind: 'text', name: file.name, text: await extractDocx(file) };
  }
  if (ext === 'doc') {
    throw new Error(`"${file.name}" format .doc lama tidak didukung. Simpan sebagai .docx dulu.`);
  }
  if (TEXT_EXTS.includes(ext) || file.type.startsWith('text/')) {
    return { kind: 'text', name: file.name, text: trimText(await file.text()) };
  }
  throw new Error(`"${file.name}" format tidak didukung. Pakai gambar, txt, csv, md, pdf, atau docx.`);
}

/** buang bytes sebelum simpan sesi (localStorage jebol kalau ikut base64) */
export function stripAttachments<T extends { attachments?: Attachment[] }>(m: T): Omit<T, 'attachments'> & { attachmentMeta?: AttachmentMeta[] } {
  if (!m.attachments?.length) return m;
  const { attachments, ...rest } = m;
  return {
    ...rest,
    attachmentMeta: attachments.map((a) => ({ kind: a.kind, name: a.name })),
  };
}
