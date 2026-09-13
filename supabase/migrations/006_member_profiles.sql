alter table public.users
  add column if not exists number text,
  add column if not exists gender text check (gender in ('male', 'female')),
  add column if not exists status text not null default 'active' check (status in ('active', 'on_leave', 'inactive')),
  add column if not exists avatar_url text,
  add column if not exists guardian_name text,
  add column if not exists attendance_pct int not null default 100 check (attendance_pct between 0 and 100),
  add column if not exists grade text,
  add column if not exists subject text,
  add column if not exists class_id uuid references public.classes(id) on delete set null;

create index if not exists idx_users_number on public.users(number);
create index if not exists idx_users_status on public.users(status);
create index if not exists idx_users_class on public.users(class_id);

drop view if exists public.users_with_role;

create view public.users_with_role as
  select u.id, u.email, u.full_name, u.role_id, u.school_id, u.whatsapp,
    u.number, u.gender, u.status, u.avatar_url, u.guardian_name,
    u.attendance_pct, u.grade, u.subject, u.class_id,
    r.name as role, u.created_at
  from public.users u join public.roles r on r.id = u.role_id;
