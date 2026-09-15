"use client";

import { useState } from "react";
import Image from "next/image";

const AVATAR_COLORS = [
  "bg-blue-700",
  "bg-violet-600",
  "bg-emerald-600",
  "orange-500",
  "bg-pink-600",
  "bg-sky-600",
];

export function AvatarChip({
  name,
  avatarUrl,
  size = "md",
}: {
  name: string;
  avatarUrl?: string | null;
  size?: "sm" | "md";
}) {
  const clean = name.trim() || "Pemain";
  const initial = clean.charAt(0).toUpperCase();
  const [imgFailed, setImgFailed] = useState(false);

  let hash = 0;
  for (let i = 0; i < clean.length; i++) {
    hash = (hash * 31 + clean.charCodeAt(i)) >>> 0;
  }
  const bg = AVATAR_COLORS[hash % AVATAR_COLORS.length];
  const circleSize = size === "sm" ? 28 : 36;
  const circleClass = size === "sm" ? "size-7 text-xs" : "size-9 text-sm";
  const showPhoto = Boolean(avatarUrl) && !imgFailed;

  return (
    <span className="inline-flex max-w-40 items-center gap-2 rounded-full bg-white py-1 pr-3 pl-1 ring-1 ring-slate-200 shadow-xs">
      {showPhoto ? (
        <Image
          src={avatarUrl as string}
          alt=""
          width={circleSize}
          height={circleSize}
          unoptimized
          onError={() => setImgFailed(true)}
          className={`flex ${circleClass} shrink-0 rounded-full object-cover`}
          aria-hidden="true"
        />
      ) : (
        <span
          className={`flex ${circleClass} shrink-0 items-center justify-center rounded-full ${bg} font-extrabold text-white`}
          aria-hidden="true"
        >
          {initial}
        </span>
      )}
      <span className="truncate text-xs font-bold text-slate-700">{clean}</span>
    </span>
  );
}
