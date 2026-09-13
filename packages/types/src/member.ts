// @bisa/types/member - kontrak data murid/guru dipakai web & api.

export type Gender = "male" | "female" | null;
export type MemberStatus = "active" | "on_leave" | "inactive";

export type Member = {
  id: string;
  email: string;
  full_name: string;
  whatsapp: string | null;
  number: string | null;
  gender: Gender;
  status: MemberStatus;
  avatar_url: string | null;
  guardian_name: string | null;
  attendance_pct: number;
  grade: string | null;
  subject: string | null;
  class_id: string | null;
  created_at?: string;
};

export type ClassOption = { id: string; name: string };

// Body wire POST /school/teachers & /school/students.
export type MemberCreateBody = {
  full_name: string;
  email: string;
  password: string;
  whatsapp?: string | null;
  number?: string | null;
  gender?: Gender;
  status?: MemberStatus;
  avatar_url?: string | null;
  guardian_name?: string | null;
  attendance_pct?: number | null;
  grade?: string | null;
  subject?: string | null;
  class_id?: string | null;
};

// Body wire PUT /school/users/:id
export type MemberUpdateBody = Partial<Omit<MemberCreateBody, "email" | "password">> & {
  full_name?: string;
};
