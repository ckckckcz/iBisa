"use client";

import { useEffect, useRef, useState } from "react";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import {
  ArrowDown01Icon,
  Cancel01Icon,
  CustomerSupportIcon,
  Delete02Icon,
  Edit02Icon,
  Message01Icon,
  Search01Icon,
  SidebarLeft01Icon,
} from "@hugeicons/core-free-icons";

import type { ChatHistoryItem } from "@/types/ai";
import { CHAT_SIDEBAR_ANIMATION } from "@/lib/constants";

function Row({
  icon,
  label,
  active = false,
  right,
  title,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  right?: React.ReactNode;
  title?: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      title={title ?? label}
      onClick={onClick}
      className={`group/row relative z-10 mx-2 flex h-8 max-w-full items-center overflow-hidden rounded-lg px-2 text-left transition-colors duration-150 active:scale-[0.98] ${
        active ? "bg-neutral-100" : "hover:bg-neutral-100"
      }`}
    >
      <span className={`flex size-5 shrink-0 items-center justify-center ${active ? "text-neutral-900" : "text-neutral-500"}`}>
        {icon}
      </span>
      <span className={`ml-1.5 min-w-0 flex-1 truncate text-[14px] font-medium ${active ? "text-neutral-900" : "text-neutral-500"}`}>
        {label}
      </span>
      {right}
    </button>
  );
}

export default function ChatSidebar({
  activeId,
  recents = [],
  onNewChat,
  onPick,
  onDelete,
  onContactAdmin,
}: {
  activeId?: string | null;
  recents?: ChatHistoryItem[];
  onNewChat?: () => void;
  onPick?: (id: string) => void;
  onDelete?: (id: string) => void;
  onContactAdmin?: () => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const dragRef = useRef<{ x: number; scroll: number; active: boolean } | null>(null);

  const visible = recents.filter((item) => item.label.toLowerCase().includes(query.trim().toLowerCase()));

  useEffect(() => {
    if (searchOpen) searchRef.current?.focus();
  }, [searchOpen]);

  const collapse = () => {
    setCollapsed(true);
    setSearchOpen(false);
    setQuery("");
  };

  const icon = (c: IconSvgElement, size = 18) => <HugeiconsIcon icon={c} size={size} strokeWidth={1.8} />;

  const railBtn =
    "flex size-9 items-center justify-center rounded-lg text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900 active:scale-[0.96]";

  return (
    <aside
      aria-label="Riwayat chat"
      className="relative flex h-full shrink-0 overflow-hidden border-r border-neutral-200 bg-white transition-[width]"
      style={{
        width: collapsed ? 52 : 224,
        transitionDuration: `${CHAT_SIDEBAR_ANIMATION.DURATION}ms`,
        transitionTimingFunction: CHAT_SIDEBAR_ANIMATION.EASING,
      }}
    >
      {/* rail ikon — tampil saat collapse, teks kepotong dihilangkan */}
      <div className={`absolute inset-0 flex-col items-center gap-1 py-2 transition-opacity duration-150 ${collapsed ? "flex opacity-100" : "pointer-events-none hidden opacity-0"}`}>
        <button type="button" title="Buka sidebar" aria-label="Buka sidebar" onClick={() => setCollapsed(false)} className={railBtn}>
          <span className="rotate-180">{icon(SidebarLeft01Icon)}</span>
        </button>
        <button type="button" title="Chat Baru" aria-label="Chat Baru" onClick={onNewChat} className={railBtn}>
          {icon(Edit02Icon)}
        </button>
        <button
          type="button"
          title="Cari chat"
          aria-label="Cari chat"
          onClick={() => {
            setCollapsed(false);
            setSearchOpen(true);
          }}
          className={railBtn}
        >
          {icon(Search01Icon, 16)}
        </button>
        <div className="min-h-0 flex-1" />
        <button type="button" title="Contact Admin" aria-label="Contact Admin" onClick={onContactAdmin} className={railBtn}>
          {icon(CustomerSupportIcon, 16)}
        </button>
      </div>

      <div className={`min-h-0 w-[224px] shrink-0 flex-col py-2 transition-opacity duration-150 ${collapsed ? "pointer-events-none flex opacity-0" : "flex opacity-100"}`}>
        <div className="relative mb-2 h-10 shrink-0">
          <span className="absolute top-1 left-2 flex h-8 items-center px-2 text-[14px] font-semibold text-neutral-900">
            Riwayat Chat
          </span>
          <button
            type="button"
            aria-label="Tutup sidebar"
            onClick={collapse}
            className="absolute top-1 right-2 flex size-8 items-center justify-center rounded-lg text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
          >
            {icon(SidebarLeft01Icon)}
          </button>
        </div>

        <div className="flex flex-col gap-px">
          <Row icon={icon(Edit02Icon)} label="Chat Baru" onClick={onNewChat} />
        </div>

        <div className="mt-3 flex min-h-0 flex-1 flex-col overflow-y-auto">
          <div className="relative mx-2 mb-1 h-8 shrink-0">
            {!searchOpen && (
              <div className="absolute inset-0 flex items-center gap-1.5 px-2 text-[12.5px] font-medium text-neutral-400">
                {icon(ArrowDown01Icon, 16)}
                <span>Chats</span>
              </div>
            )}
            {!searchOpen && (
              <button
                type="button"
                aria-label="Cari chat"
                onClick={() => setSearchOpen(true)}
                className="absolute top-0 right-0 z-10 flex size-8 items-center justify-center rounded-lg text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-900 active:scale-[0.96]"
              >
                {icon(Search01Icon, 16)}
              </button>
            )}
            {searchOpen && (
              <div className="absolute top-0 right-0 z-20 flex h-8 w-full items-center overflow-hidden rounded-lg border border-neutral-200 bg-white">
                <span className="ml-2 flex shrink-0 items-center text-neutral-400">{icon(Search01Icon, 15)}</span>
                <input
                  ref={searchRef}
                  value={query}
                  title={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") {
                      setSearchOpen(false);
                      setQuery("");
                    }
                  }}
                  onPointerDown={(e) => {
                    dragRef.current = { x: e.clientX, scroll: e.currentTarget.scrollLeft, active: false };
                  }}
                  onPointerMove={(e) => {
                    const d = dragRef.current;
                    const el = e.currentTarget;
                    if (!d) return;
                    if (!d.active && Math.abs(e.clientX - d.x) > 6) {
                      d.active = true;
                      const pos = el.selectionStart ?? 0;
                      el.setSelectionRange(pos, pos);
                      try { el.setPointerCapture(e.pointerId); } catch { /* abaikan */ }
                    }
                    if (d.active) el.scrollLeft = d.scroll - (e.clientX - d.x);
                  }}
                  onPointerUp={() => { dragRef.current = null; }}
                  onPointerCancel={() => { dragRef.current = null; }}
                  placeholder="Cari chat"
                  aria-label="Cari riwayat chat"
                  className="ml-1.5 min-w-0 flex-1 touch-pan-x bg-transparent text-[13px] text-neutral-900 outline-none placeholder:text-neutral-400"
                />
                <button
                  type="button"
                  aria-label="Tutup pencarian"
                  onClick={() => {
                    setSearchOpen(false);
                    setQuery("");
                  }}
                  className="flex size-8 shrink-0 items-center justify-center rounded-lg text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
                >
                  {icon(Cancel01Icon, 16)}
                </button>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-px">
            {visible.map((item) => {
              const active = item.id === activeId;
              return (
                <div key={item.id} className="group relative">
                  <Row
                    icon={icon(Message01Icon)}
                    label={item.label}
                    active={active}
                    onClick={() => onPick?.(item.id)}
                    right={
                      onDelete ? (
                        <span
                          role="button"
                          tabIndex={0}
                          aria-label={`Hapus ${item.label}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete(item.id);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") onDelete(item.id);
                          }}
                          className="mr-1 hidden shrink-0 rounded p-0.5 text-neutral-400 group-hover:block hover:bg-neutral-200 hover:text-neutral-900"
                        >
                          {icon(Delete02Icon, 14)}
                        </span>
                      ) : undefined
                    }
                  />
                </div>
              );
            })}
            {query && visible.length === 0 && (
              <div className="mx-2 px-2 py-2 text-[12.5px] text-neutral-400">Tidak ada chat ditemukan</div>
            )}
            {!query && visible.length === 0 && (
              <div className="mx-2 px-2 py-2 text-[12.5px] text-neutral-400">Belum ada riwayat</div>
            )}
          </div>
        </div>

        <div className="mx-2 mt-3 w-[208px] shrink-0 border-t border-neutral-200 pt-3">
          <button
            type="button"
            onClick={onContactAdmin}
            className="flex h-8 w-full items-center justify-center gap-1.5 rounded-lg bg-neutral-100 text-[12.5px] font-medium text-neutral-900 transition-all duration-150 hover:bg-neutral-200 active:scale-[0.98]"
          >
            {icon(CustomerSupportIcon, 16)}
            Contact Admin
          </button>
        </div>
      </div>
    </aside>
  );
}
