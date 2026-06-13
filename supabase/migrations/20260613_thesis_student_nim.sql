alter table public.theses
  add column if not exists student_nim text;

create index if not exists theses_student_identity_idx
  on public.theses (lower(student_name), student_nim);
