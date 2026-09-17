export type SchoolListResponse<T> = { success: boolean; data: T; message?: string };
export type BatchItemResult = { success: boolean; error?: string };
export type BatchResponse = { createdCount: number; failedCount: number; results: BatchItemResult[] };

export async function fetchSchoolList<T>(apiUrl: string, token: string, path: "students" | "teachers" | "classes" | "teachers/assignments"): Promise<SchoolListResponse<T>> {
  const res = await fetch(`${apiUrl}/school/${path}`, { headers: { Authorization: `Bearer ${token}` } });
  return (await res.json()) as SchoolListResponse<T>;
}
