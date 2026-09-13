import { useState } from "react";
import { EMPTY_FORM, toFormPayload, type FormPayload, type Member } from "@/types/school";

export function useMemberForm({ open, initial }: { open: boolean; initial: Member | null }) {
  const [f, setF] = useState<FormPayload>(EMPTY_FORM);
  const set = (k: keyof FormPayload, v: string | number | null) => setF((p) => ({ ...p, [k]: v ?? "" }));

  const [prevSig, setPrevSig] = useState<string | null>(null);
  const sig = open ? (initial?.id ?? "new") : null;
  if (prevSig !== sig) {
    setPrevSig(sig);
    if (open) setF(initial ? toFormPayload(initial) : EMPTY_FORM);
  }

  return { f, set, isEdit: !!initial };
}
