"use client";

import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { ExcelMemberRow } from "@/lib/excel-import";

export function CsvPreviewModal({
  open,
  onOpenChange,
  items,
  mode,
  submitting,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: ExcelMemberRow[];
  mode: "teacher" | "student";
  submitting: boolean;
  onConfirm: () => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>Konfirmasi Batch Import {mode === "teacher" ? "Guru" : "Siswa"}</SheetTitle>
          <SheetDescription>
            Periksa daftar akun di bawah ini sebelum diproses. Total:{" "}
            <span className="font-semibold text-foreground">{items.length} pengguna</span>.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-3 p-4">
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs text-blue-900">
            <span className="font-bold">Info Password Awal:</span> Pengguna yang tidak menentukan password di file Excel/CSV akan otomatis menggunakan NIP/NISN (`number`) sebagai password login awal.
          </div>

          <div className="max-h-72 overflow-y-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>{mode === "teacher" ? "NIP / No" : "NISN / No"}</TableHead>
                  <TableHead>{mode === "teacher" ? "Mapel" : "Wali / Grade"}</TableHead>
                  <TableHead>Password Awal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((row, idx) => {
                  const num = String(row.number ?? "").trim();
                  const pwLabel = row.password
                    ? "Kustom"
                    : num.length >= 6
                    ? `NIP/NISN (${num})`
                    : num
                    ? `${num}1234`
                    : "Bisa1234!";

                  return (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">{row.full_name}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{row.email}</TableCell>
                      <TableCell>{row.number || "-"}</TableCell>
                      <TableCell>
                        {mode === "teacher"
                          ? row.subject || "-"
                          : row.guardian_name || row.grade || "-"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="font-mono text-[10px]">
                          {pwLabel}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>

        <SheetFooter className="flex-row justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Batal
          </Button>
          <Button onClick={onConfirm} disabled={submitting || items.length === 0}>
            {submitting ? "Membuat Akun..." : `Konfirmasi & Buat ${items.length} Akun`}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
