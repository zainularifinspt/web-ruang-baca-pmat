alter table public.books
  add column if not exists rack_location text;

alter table public.theses
  add column if not exists cover_url text,
  add column if not exists physical_location text,
  add column if not exists access_note text default 'Dokumen lengkap tersedia dalam bentuk fisik di Ruang Baca Program Studi Pendidikan Matematika.';

update public.theses
set access_note = 'Dokumen lengkap tersedia dalam bentuk fisik di Ruang Baca Program Studi Pendidikan Matematika.'
where access_note is null;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'books'
      and column_name = 'location'
  ) then
    execute 'update public.books set rack_location = coalesce(rack_location, location) where rack_location is null';
  end if;
end $$;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'theses'
      and column_name = 'location'
  ) then
    execute 'update public.theses set physical_location = coalesce(physical_location, location) where physical_location is null';
  end if;
end $$;
