create table if not exists public.classes (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  name text not null,
  tingkat text not null,
  wali_guru_id uuid references public.users(id) on delete set null,
  created_at timestamptz default now(),
  unique(school_id, name)
);

create index if not exists idx_classes_school on public.classes(school_id);
create index if not exists idx_classes_wali on public.classes(wali_guru_id);

alter table public.classes enable row level security;

drop policy if exists "classes_school_rw" on public.classes;
create policy "classes_school_rw" on public.classes for all using (true) with check (true);
