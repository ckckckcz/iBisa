-- Membuat tabel quiz_results
create table if not exists public.quiz_results (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  student_id uuid not null references public.users(id) on delete cascade,
  score int not null,
  correct_count int not null,
  total_questions int not null,
  created_at timestamptz default now()
);

-- Membuat index untuk pencarian cepat
create index if not exists idx_quiz_results_quiz on public.quiz_results(quiz_id);
create index if not exists idx_quiz_results_student on public.quiz_results(student_id);

-- Mengaktifkan Row Level Security (RLS)
alter table public.quiz_results enable row level security;

-- Policy agar backend (Admin) bisa bebas insert/select data
drop policy if exists "quiz_results_rw" on public.quiz_results;
create policy "quiz_results_rw" on public.quiz_results for all using (true) with check (true);