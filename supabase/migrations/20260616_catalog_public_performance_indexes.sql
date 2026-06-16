create extension if not exists pg_trgm;

create index if not exists books_public_created_at_idx
  on public.books (verification_status, created_at desc);

create index if not exists theses_public_created_at_idx
  on public.theses (verification_status, created_at desc);

create index if not exists books_category_idx
  on public.books (category);

create index if not exists theses_topic_idx
  on public.theses (topic);

create index if not exists books_title_trgm_idx
  on public.books using gin (lower(title) gin_trgm_ops);

create index if not exists books_author_trgm_idx
  on public.books using gin (lower(author) gin_trgm_ops);

create index if not exists theses_title_trgm_idx
  on public.theses using gin (lower(title) gin_trgm_ops);

create index if not exists theses_student_name_trgm_idx
  on public.theses using gin (lower(student_name) gin_trgm_ops);

create index if not exists theses_supervisor_1_trgm_idx
  on public.theses using gin (lower(supervisor_1) gin_trgm_ops);

create index if not exists theses_supervisor_2_trgm_idx
  on public.theses using gin (lower(supervisor_2) gin_trgm_ops);

do $$
declare
  books_keywords_type text;
  theses_keywords_type text;
begin
  select data_type
    into books_keywords_type
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'books'
      and column_name = 'keywords';

  if books_keywords_type = 'ARRAY' then
    execute 'create index if not exists books_keywords_gin_idx on public.books using gin (keywords)';
  elsif books_keywords_type in ('text', 'character varying') then
    execute 'create index if not exists books_keywords_trgm_idx on public.books using gin (lower(keywords) gin_trgm_ops)';
  elsif books_keywords_type = 'jsonb' then
    execute 'create index if not exists books_keywords_jsonb_gin_idx on public.books using gin (keywords jsonb_path_ops)';
  end if;

  select data_type
    into theses_keywords_type
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'theses'
      and column_name = 'keywords';

  if theses_keywords_type = 'ARRAY' then
    execute 'create index if not exists theses_keywords_gin_idx on public.theses using gin (keywords)';
  elsif theses_keywords_type in ('text', 'character varying') then
    execute 'create index if not exists theses_keywords_trgm_idx on public.theses using gin (lower(keywords) gin_trgm_ops)';
  elsif theses_keywords_type = 'jsonb' then
    execute 'create index if not exists theses_keywords_jsonb_gin_idx on public.theses using gin (keywords jsonb_path_ops)';
  end if;
end $$;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'books'
      and column_name = 'year'
  ) then
    execute 'create index if not exists books_year_idx on public.books (year)';
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'theses'
      and column_name = 'year'
  ) then
    execute 'create index if not exists theses_year_idx on public.theses (year)';
  end if;
end $$;
