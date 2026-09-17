-- Kelas yang diajar oleh guru (kelas binaan, bisa lebih dari satu).
-- Relation wali kelas tetap di classes.wali_guru_id (satu wali per kelas).
create table if not exists public.teacher_classes (
  teacher_id uuid not null references public.users(id) on delete cascade,
  class_id uuid not null references public.classes(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (teacher_id, class_id)
);

create index if not exists idx_teacher_classes_teacher on public.teacher_classes(teacher_id);
create index if not exists idx_teacher_classes_class on public.teacher_classes(class_id);

alter table public.teacher_classes enable row level security;

drop policy if exists "teacher_classes_rw" on public.teacher_classes;
create policy "teacher_classes_rw" on public.teacher_classes for all using (true) with check (true);