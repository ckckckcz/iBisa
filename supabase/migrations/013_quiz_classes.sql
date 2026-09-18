-- Penugasan kuis ke kelas. Kuis hanya terlihat oleh siswa di kelas yang
-- dicantumkan di sini. Tanpa baris = kuis tersembunyi dari semua siswa.
create table if not exists public.quiz_classes (
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  class_id uuid not null references public.classes(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (quiz_id, class_id)
);

create index if not exists idx_quiz_classes_quiz on public.quiz_classes(quiz_id);
create index if not exists idx_quiz_classes_class on public.quiz_classes(class_id);

alter table public.quiz_classes enable row level security;

drop policy if exists "quiz_classes_rw" on public.quiz_classes;
create policy "quiz_classes_rw" on public.quiz_classes for all using (true) with check (true);