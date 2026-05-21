create table if not exists public.borrowers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  identity_number text null,
  borrower_type text null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.loans (
  id uuid primary key default gen_random_uuid(),
  borrower_id uuid not null references public.borrowers(id) on delete restrict,
  item_type text not null check (item_type in ('book', 'thesis')),
  book_id uuid null references public.books(id) on delete restrict,
  thesis_id uuid null references public.theses(id) on delete restrict,
  loan_date date not null default current_date,
  due_date date not null,
  returned_at timestamptz null,
  status text not null default 'active' check (status in ('active', 'returned', 'overdue', 'cancelled')),
  notes text null,
  created_by uuid null references public.profiles(id),
  success_notified_at timestamptz null,
  reminder_h1_sent_at timestamptz null,
  reminder_due_sent_at timestamptz null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint loans_item_target_check check (
    (item_type = 'book' and book_id is not null and thesis_id is null)
    or
    (item_type = 'thesis' and thesis_id is not null and book_id is null)
  ),
  constraint loans_due_after_loan_check check (due_date >= loan_date)
);

create index if not exists borrowers_phone_idx on public.borrowers (phone);
create index if not exists loans_status_due_date_idx on public.loans (status, due_date);
create index if not exists loans_borrower_id_idx on public.loans (borrower_id);

create unique index if not exists loans_one_open_book_idx
  on public.loans (book_id)
  where book_id is not null and status in ('active', 'overdue');

create unique index if not exists loans_one_open_thesis_idx
  on public.loans (thesis_id)
  where thesis_id is not null and status in ('active', 'overdue');
