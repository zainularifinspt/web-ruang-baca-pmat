create table if not exists public.website_visits (
  id uuid primary key default gen_random_uuid(),
  visitor_id text not null,
  visit_date date not null default ((now() at time zone 'Asia/Makassar')::date),
  page_path text not null default '/',
  user_agent text,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (visitor_id, visit_date)
);

create index if not exists website_visits_visit_date_idx
  on public.website_visits (visit_date);

alter table public.website_visits enable row level security;

drop policy if exists "Public can read website visit counts"
  on public.website_visits;

create policy "Public can read website visit counts"
  on public.website_visits
  for select
  to anon, authenticated
  using (true);

do $$
begin
  if exists (
    select 1
    from pg_publication
    where pubname = 'supabase_realtime'
  )
  and not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'website_visits'
  ) then
    alter publication supabase_realtime add table public.website_visits;
  end if;
end $$;
