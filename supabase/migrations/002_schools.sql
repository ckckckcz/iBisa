insert into public.roles(name) values ('school') on conflict (name) do nothing;

create table if not exists public.schools (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  npsn varchar(12) unique not null check (npsn ~ '^[0-9]{8,12}$'),
  jenjang text not null check (jenjang in ('SD','SMP','SMA','SMK','MA','SLB')),
  alamat text not null,
  kota text not null,
  provinsi text not null,
  created_at timestamptz default now()
);

alter table public.schools enable row level security;

drop policy if exists "schools_select_all" on public.schools;
drop policy if exists "schools_insert_service" on public.schools;

create policy "schools_select_all" on public.schools for select using (true);
create policy "schools_insert_service" on public.schools for insert with check (true);

alter table public.users add column if not exists school_id uuid references public.schools(id) on delete set null;
alter table public.users add column if not exists whatsapp text;

create index if not exists idx_users_school on public.users(school_id);
create index if not exists idx_schools_npsn on public.schools(npsn);
