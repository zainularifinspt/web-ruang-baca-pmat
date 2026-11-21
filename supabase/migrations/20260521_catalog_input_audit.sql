alter table public.books
  add column if not exists created_by uuid references public.profiles(id) on delete set null,
  add column if not exists input_source text,
  add column if not exists input_by text;

alter table public.theses
  add column if not exists created_by uuid references public.profiles(id) on delete set null,
  add column if not exists input_source text,
  add column if not exists input_by text;
