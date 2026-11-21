create table if not exists public.attendance_visitors (
  nim_nip text primary key,
  full_name text not null,
  visitor_status text not null default 'Mahasiswa'
    check (visitor_status in ('Mahasiswa', 'Dosen', 'Umum')),
  study_program text not null default 'Pendidikan Matematika',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.attendance_visitors enable row level security;

drop policy if exists "Public can read attendance visitor identity"
  on public.attendance_visitors;

create policy "Public can read attendance visitor identity"
  on public.attendance_visitors
  for select
  to anon, authenticated
  using (true);

