alter table public.theses
  add column if not exists pdf_url text,
  add column if not exists pdf_filename text,
  add column if not exists pdf_size integer;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('skripsi-pdf', 'skripsi-pdf', true, 5242880, array['application/pdf'])
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
