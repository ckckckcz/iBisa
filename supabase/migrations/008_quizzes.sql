create table if not exists public.quizzes (
  id uuid primary key default gen_random_uuid(),
  school_id uuid references public.schools(id) on delete cascade,
  created_by uuid references public.users(id) on delete set null,
  code text not null unique,
  title text not null,
  subject text not null default '',
  time_limit int not null default 60,
  base_points int not null default 1000,
  questions jsonb not null default '[]'::jsonb,
  created_at timestamptz default now()
);

create index if not exists idx_quizzes_school on public.quizzes(school_id);
create index if not exists idx_quizzes_code on public.quizzes(code);

alter table public.quizzes enable row level security;

drop policy if exists "quiz_rw" on public.quizzes;
create policy "quiz_rw" on public.quizzes for all using (true) with check (true);
