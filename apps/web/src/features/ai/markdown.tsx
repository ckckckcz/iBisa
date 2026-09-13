"use client";

import type { ReactNode } from "react";

function inline(text: string, keyPrefix: string): ReactNode[] {
  const parts: ReactNode[] = [];
  const re = /(\*\*.+?\*\*|\*[^*\n]+\*|`[^`\n]+`)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    const tok = m[0];
    if (tok.startsWith("**")) parts.push(<strong key={`${keyPrefix}-${k++}`} className="font-semibold">{tok.slice(2, -2)}</strong>);
    else if (tok.startsWith("`")) parts.push(<code key={`${keyPrefix}-${k++}`} className="rounded bg-neutral-100 px-1 py-px font-mono text-[12px]">{tok.slice(1, -1)}</code>);
    else parts.push(<em key={`${keyPrefix}-${k++}`}>{tok.slice(1, -1)}</em>);
    last = m.index + tok.length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

export default function Markdown({ text }: { text: string }) {
  const lines = text.split("\n");
  const blocks: ReactNode[] = [];
  let i = 0;
  let k = 0;

  while (i < lines.length) {
    const line = lines[i];

    // code fence
    if (line.trim().startsWith("```")) {
      const buf: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith("```")) { buf.push(lines[i]); i++; }
      i++;
      blocks.push(
        <pre key={k++} className="mt-1.5 overflow-x-auto rounded-lg border border-neutral-200 bg-neutral-50 p-2.5 font-mono text-[12px] leading-relaxed whitespace-pre-wrap">{buf.join("\n")}</pre>
      );
      continue;
    }

    // heading
    const h = /^(#{1,3})\s+(.*)/.exec(line);
    if (h) {
      blocks.push(<p key={k++} className="mt-2 font-semibold text-neutral-900">{inline(h[2], `h${k}`)}</p>);
      i++;
      continue;
    }

    // quote
    if (line.trim().startsWith(">")) {
      blocks.push(<p key={k++} className="mt-1.5 border-l-2 border-neutral-200 pl-2 text-neutral-600">{inline(line.trim().slice(1).trim(), `q${k}`)}</p>);
      i++;
      continue;
    }

    // table
    if (line.includes("|") && i + 1 < lines.length && /^\s*\|?[\s:|-]+\|?[\s:|-]*$/.test(lines[i + 1])) {
      const head = line.split("|").map((s) => s.trim()).filter(Boolean);
      i += 2;
      const rows: string[][] = [];
      while (i < lines.length && lines[i].includes("|")) {
        rows.push(lines[i].split("|").map((s) => s.trim()).filter(Boolean));
        i++;
      }
      blocks.push(
        <span key={k++} className="mt-1.5 block overflow-x-auto rounded-lg border border-neutral-200">
          <table className="w-full border-collapse text-[12.5px]">
            <thead><tr>{head.map((c, ci) => <th key={ci} className="border-b border-neutral-200 bg-neutral-50 px-2 py-1 text-left font-semibold">{c}</th>)}</tr></thead>
            <tbody>{rows.map((r, ri) => <tr key={ri}>{r.map((c, ci) => <td key={ci} className="border-b border-neutral-100 px-2 py-1 last:border-0">{inline(c, `t${k}-${ri}-${ci}`)}</td>)}</tr>)}</tbody>
          </table>
        </span>
      );
      continue;
    }

    // list
    const lm = /^\s*(?:[-*]|\d+[.)])\s+(.*)/.exec(line);
    if (lm) {
      const items: string[] = [lm[1]];
      i++;
      while (i < lines.length) {
        const m2 = /^\s*(?:[-*]|\d+[.)])\s+(.*)/.exec(lines[i]);
        if (!m2) break;
        items.push(m2[1]);
        i++;
      }
      blocks.push(
        <ul key={k++} className="mt-1.5 flex flex-col gap-1">
          {items.map((it, ii) => (
            <li key={ii} className="flex gap-1.5 text-neutral-800"><span className="shrink-0 text-neutral-400">•</span><span>{inline(it, `l${k}-${ii}`)}</span></li>
          ))}
        </ul>
      );
      continue;
    }

    if (!line.trim()) { i++; continue; }

    // paragraph (gabung baris lanjutan)
    const buf = [line];
    i++;
    while (i < lines.length && lines[i].trim() && !/^\s*(?:[-*]|\d+[.)])\s+/.test(lines[i]) && !lines[i].trim().startsWith("```") && !lines[i].trim().startsWith(">") && !lines[i].includes("|") && !/^(#{1,3})\s+/.test(lines[i])) {
      buf.push(lines[i]);
      i++;
    }
    blocks.push(<p key={k++} className="mt-1.5 leading-relaxed first:mt-0">{inline(buf.join(" "), `p${k}`)}</p>);
  }

  return <div className="text-[13px] text-neutral-900">{blocks}</div>;
}
