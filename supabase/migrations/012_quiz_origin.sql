alter table public.quizzes
  add column if not exists original_by uuid references public.users(id) on delete set null;

create index if not exists idx_quizzes_original_by on public.quizzes(original_by);