alter table public.books
  add column if not exists verification_status text not null default 'pending';

alter table public.books
  drop constraint if exists books_verification_status_check;

alter table public.books
  add constraint books_verification_status_check
  check (verification_status in ('pending', 'approved', 'rejected'));
