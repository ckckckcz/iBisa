"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { Alert01Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";

export function QuizNotFound({ onBack }: { onBack: () => void }) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-sm rounded-3xl bg-white p-8 text-center shadow-xs ring-1 ring-slate-200">
        <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
          <HugeiconsIcon icon={Alert01Icon} strokeWidth={2} className="size-8" />
        </div>
        <p className="text-lg font-extrabold text-slate-900">Kode tidak ditemukan</p>
        <p className="mt-1 text-sm text-slate-500">
          Cek lagi 6 angkanya, atau pilih kuis dari lobby.
        </p>
        <Button
          onClick={onBack}
          className="mt-6 w-full rounded-2xl bg-blue-700 font-extrabold text-white hover:bg-blue-800"
        >
          Kembali ke Lobby
        </Button>
      </div>
    </div>
  );
}
