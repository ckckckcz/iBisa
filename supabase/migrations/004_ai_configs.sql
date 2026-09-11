create table if not exists public.ai_configs (
  school_id uuid primary key references public.schools(id) on delete cascade,
  system_prompt text not null default 'Kamu asisten BISA ramah untuk ABK.',
  model text not null default 'gpt-4o-mini',
  updated_at timestamptz default now()
);

alter table public.ai_configs enable row level security;

drop policy if exists "ai_school_rw" on public.ai_configs;
create policy "ai_school_rw" on public.ai_configs for all using (true) with check (true);
