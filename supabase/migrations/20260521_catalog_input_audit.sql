alter table public.books
  add column if not exists input_source text,
  add column if not exists input_by text;

alter table public.theses
  add column if not exists input_source text,
  add column if not exists input_by text;
