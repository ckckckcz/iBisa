"use client";

import * as React from "react";
import { AlertDialog } from "@base-ui/react/alert-dialog";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export type ConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  busy?: boolean;
  onConfirm?: () => void;
};

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Hapus",
  cancelLabel = "Batal",
  busy = false,
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialog.Portal>
        <AlertDialog.Backdrop
          data-slot="confirm-dialog-backdrop"
          className="fixed inset-0 z-50 bg-black/40 transition-opacity duration-200 data-starting-style:opacity-0 data-ending-style:opacity-0"
        />
        <AlertDialog.Popup
          data-slot="confirm-dialog-popup"
          className="data-slot=[popup] fixed top-1/2 left-1/2 z-50 w-[calc(100vw-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-lg border border-neutral-200 bg-white p-5 shadow-lg transition-all duration-200 outline-none data-starting-style:scale-95 data-starting-style:opacity-0 data-ending-style:scale-95 data-ending-style:opacity-0 dark:border-neutral-800 dark:bg-neutral-900"
        >
          <AlertDialog.Title className="text-base font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">
            {title}
          </AlertDialog.Title>
          {description && (
            <AlertDialog.Description className="mt-1 text-sm leading-relaxed text-muted-foreground">
              {description}
            </AlertDialog.Description>
          )}
          <div className="mt-4 flex items-center justify-end gap-2">
            <AlertDialog.Close
              disabled={busy}
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              {cancelLabel}
            </AlertDialog.Close>
            <button
              type="button"
              disabled={busy}
              onClick={onConfirm}
              className={cn(buttonVariants({ variant: "destructive", size: "sm" }), "bg-destructive text-white hover:bg-destructive/80 dark:bg-destructive dark:hover:bg-destructive/80")}
            >
              {busy ? "Menghapus..." : confirmLabel}
            </button>
          </div>
        </AlertDialog.Popup>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}