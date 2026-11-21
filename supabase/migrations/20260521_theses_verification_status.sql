alter table public.theses
  add column if not exists verification_status text not null default 'pending';

alter table public.theses
  drop constraint if exists theses_verification_status_check;

alter table public.theses
  add constraint theses_verification_status_check
  check (verification_status in ('pending', 'approved', 'rejected'));
