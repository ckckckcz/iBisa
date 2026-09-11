create table if not exists public.roles (
  id uuid primary key default gen_random_uuid(),
  name text unique not null
);

insert into public.roles(name) values ('student'),('teacher') on conflict (name) do nothing;

-- users
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text not null,
  role_id uuid not null references public.roles(id),
  created_at timestamptz default now()
);

create index if not exists idx_users_role on public.users(role_id);
create index if not exists idx_users_email on public.users(email);

-- RLS
alter table public.users enable row level security;
alter table public.roles enable row level security;

drop policy if exists "users_select_own" on public.users;
drop policy if exists "users_insert_service" on public.users;
drop policy if exists "users_update_own" on public.users;
drop policy if exists "roles_select_all" on public.roles;

create policy "users_select_own" on public.users
  for select using (auth.uid() = id);

create policy "users_insert_service" on public.users
  for insert with check (true);

create policy "users_update_own" on public.users
  for update using (auth.uid() = id);

create policy "roles_select_all" on public.roles
  for select using (true);

-- helper view
create or replace view public.users_with_role as
  select u.id, u.email, u.full_name, u.role_id, r.name as role, u.created_at
  from public.users u join public.roles r on r.id = u.role_id;
