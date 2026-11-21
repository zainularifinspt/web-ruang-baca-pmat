alter table public.draft_submissions
  add column if not exists parsing_error boolean not null default false,
  add column if not exists unknown_sender boolean not null default false;

create index if not exists draft_submissions_parsing_error_idx
  on public.draft_submissions(parsing_error);

create index if not exists draft_submissions_unknown_sender_idx
  on public.draft_submissions(unknown_sender);
