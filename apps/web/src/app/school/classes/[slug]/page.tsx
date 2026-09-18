"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon } from "@hugeicons/core-free-icons";
import { MemberTable } from "@/features/school/member-table";
import { MemberTableSkeleton } from "@/features/school/member-table-skeleton";
import { Skeleton } from "@/components/ui/skeleton";
import { studentColumns } from "@/features/school/student-columns";
import type { Member } from "@/types/school";
import { getValidToken } from "@/lib/ai-helpers";
import { fetchSchoolList } from "@/lib/school-api";
import { dataGet, dataSet } from "@/lib/data-cache";

type Kelas = { id: string; name: string; tingkat: string; wali_guru_id: string | null };
type Guru = { id: string; full_name: string };

export default function ClassStudentsPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const slug = params.slug;
  const cachedKelas = dataGet<Kelas[]>("school:classes");
  const cachedGurus = dataGet<Guru[]>("school:teachers");
  const cachedStudents = dataGet<Member[]>("school:students");
  const [kelas, setKelas] = useState<Kelas | null>(() => (cachedKelas?.find((k) => k.id === slug) ?? null));
  const [wali, setWali] = useState(() => {
    const k = cachedKelas?.find((c) => c.id === slug);
    if (!k) return "-";
    const w = cachedGurus?.find((x) => x.id === k.wali_guru_id);
    return w?.full_name ?? "Tanpa wali";
  });
  const [students, setStudents] = useState<Member[]>(() => (cachedStudents?.filter((m) => m.class_id === slug) ?? []));
  const [loaded, setLoaded] = useState(() => cachedKelas !== null || cachedStudents !== null);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const token = await getValidToken();
      try {
        const [c, g, s] = await Promise.all([
          fetchSchoolList<Kelas[]>(apiUrl, token, "classes"),
          fetchSchoolList<Guru[]>(apiUrl, token, "teachers"),
          fetchSchoolList<Member[]>(apiUrl, token, "students"),
        ]);
        if (cancelled) return;
        if (c.success) dataSet("school:classes", c.data);
        if (g.success) dataSet("school:teachers", g.data);
        if (s.success) dataSet("school:students", s.data);
        const found = (c.success ? c.data : []).find((k) => k.id === slug) ?? null;
        setKelas(found);
        if (found) {
          const w = (g.success ? g.data : []).find((x) => x.id === found.wali_guru_id);
          setWali(w?.full_name ?? "Tanpa wali");
        }
        if (s.success) setStudents(s.data.filter((m) => m.class_id === slug));
        setLoaded(true);
      } catch { setLoaded(true); }
    })();
    return () => { cancelled = true; };
  }, [apiUrl, slug]);

  const columns = useMemo(() => studentColumns(), []);

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 lg:p-6">
      <div>
        <Button variant="ghost" size="sm" onClick={() => router.push("/school/classes")}>
          <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} /> Semua Kelas
        </Button>
      </div>
      {!loaded ? (
        <div className="flex flex-col gap-4">
          <div>
            <Skeleton className="h-7 w-64" />
            <Skeleton className="mt-2 h-4 w-80" />
          </div>
          <MemberTableSkeleton />
        </div>
      ) : !kelas ? (
        <p className="py-8 text-center text-sm text-muted-foreground">Kelas tidak ditemukan</p>
      ) : (
        <>
          <div>
            <h1 className="text-xl font-semibold">Murid kelas {kelas.name}</h1>
            <p className="text-sm text-muted-foreground">Tingkat {kelas.tingkat} • Wali: {wali} • {students.length} murid</p>
          </div>
          <MemberTable
            rows={students} columns={columns} searchPlaceholder={`Search in ${kelas.name}`}
            searchKeys={["full_name", "number", "guardian_name", "grade"]}
            filters={[
              { key: "gender", label: "Gender", options: [{ value: "male", label: "Male" }, { value: "female", label: "Female" }] },
              { key: "status", label: "Status", options: [{ value: "active", label: "Active" }, { value: "on_leave", label: "On leave" }, { value: "inactive", label: "Inactive" }] },
            ]}
            exportName={`students-${kelas.name}`}
          />
        </>
      )}
    </div>
  );
}
