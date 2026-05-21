create table if not exists public.whatsapp_petugas (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete set null,
  nama text,
  phone_number text unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.draft_submissions (
  id uuid primary key default gen_random_uuid(),
  sender_phone text,
  sender_name text,
  submitted_by uuid null references public.profiles(id) on delete set null,
  type text check (type in ('book', 'thesis')),
  title text,
  author text,
  year int null,
  category text null,
  description text null,
  raw_message text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  verified_by uuid null references public.profiles(id) on delete set null,
  verified_at timestamptz null,
  created_at timestamptz not null default now()
);

create index if not exists whatsapp_petugas_profile_id_idx
  on public.whatsapp_petugas(profile_id);

create index if not exists whatsapp_petugas_phone_number_idx
  on public.whatsapp_petugas(phone_number);

create index if not exists draft_submissions_status_created_at_idx
  on public.draft_submissions(status, created_at desc);

create index if not exists draft_submissions_submitted_by_idx
  on public.draft_submissions(submitted_by);

alter table public.whatsapp_petugas enable row level security;
alter table public.draft_submissions enable row level security;
