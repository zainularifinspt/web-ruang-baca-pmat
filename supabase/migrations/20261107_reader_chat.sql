-- Reader data is accessed through server routes; source access is rechecked there.
create extension if not exists vector with schema extensions;
grant usage on schema public,extensions to service_role;
create table if not exists public.reader_documents (
 id text primary key, collection_id text not null, kind text not null check(kind in ('book','thesis')),
 title text not null, author text not null default '', is_public boolean not null default false,
 active_revision text, updated_at timestamptz not null default now(), unique(kind,collection_id)
);
create table if not exists public.reader_document_versions (
 id text not null, document_id text not null references public.reader_documents(id) on delete cascade,
 source_hash text not null, source_url text not null, policy text not null, total_pages integer not null,
 outline jsonb not null default '[]', embedding_model text, embedding_ready boolean not null default false,
 created_at timestamptz not null default now(), primary key(document_id,id)
);
create table if not exists public.reader_pages (
 document_id text not null, revision text not null, page_number integer not null check(page_number>0),
 label text not null, width real not null, height real not null, text_content text not null default '',
 image text not null, thumbnail text not null, hd text not null, words jsonb not null default '[]', quality text not null,
 search_vector tsvector generated always as (to_tsvector('simple',text_content)) stored,
 primary key(document_id,revision,page_number),
 foreign key(document_id,revision) references public.reader_document_versions(document_id,id) on delete cascade
);
create index if not exists reader_pages_fts on public.reader_pages using gin(search_vector);
create table if not exists public.reader_chunks (
 document_id text not null, revision text not null, id text not null, page_number integer not null,
 text_content text not null, embedding extensions.vector(384),
 search_vector tsvector generated always as (to_tsvector('simple',text_content)) stored,
 primary key(document_id,revision,id),
 foreign key(document_id,revision,page_number) references public.reader_pages(document_id,revision,page_number) on delete cascade
);
create index if not exists reader_chunks_fts on public.reader_chunks using gin(search_vector);
create table if not exists public.reader_jobs (
 id uuid primary key default gen_random_uuid(), document_id text not null, status text not null default 'queued',
 progress integer not null default 0, message text, updated_at timestamptz not null default now()
);
create table if not exists public.chat_usage (
 bucket_key text primary key, units bigint not null default 0, expires_at timestamptz not null
);
alter table public.reader_documents enable row level security;
alter table public.reader_document_versions enable row level security;
alter table public.reader_pages enable row level security;
alter table public.reader_chunks enable row level security;
alter table public.reader_jobs enable row level security;
alter table public.chat_usage enable row level security;
revoke all on public.reader_documents,public.reader_document_versions,public.reader_pages,public.reader_chunks,public.reader_jobs,public.chat_usage from anon,authenticated;
grant all on public.reader_documents,public.reader_document_versions,public.reader_pages,public.reader_chunks,public.reader_jobs,public.chat_usage to service_role;

create or replace function public.reader_search(p_document text,p_revision text,p_query text,p_offset integer default 0)
returns table(page_number integer,label text,text_content text,score real)
language sql stable security invoker set search_path=public,extensions as $$
 select p.page_number,p.label,p.text_content,ts_rank_cd(p.search_vector,websearch_to_tsquery('simple',left(p_query,200)))
 from reader_pages p join reader_documents d on d.id=p.document_id and d.active_revision=p.revision and d.is_public
 where p.document_id=p_document and p.revision=p_revision and p.search_vector @@ websearch_to_tsquery('simple',left(p_query,200))
 order by 4 desc,p.page_number limit 21 offset greatest(0,least(p_offset,2000));
$$;
create or replace function public.reader_retrieve(p_query text,p_document text default null,p_page integer default null,p_embedding extensions.vector(384) default null)
returns table(id text,document_id text,collection_id text,kind text,title text,author text,revision text,page_number integer,label text,text_content text,score double precision)
language sql stable security invoker set search_path=public,extensions as $$
 with ranked as (
 select c.*,d.collection_id,d.kind,d.title,d.author,p.label,
 (ts_rank_cd(c.search_vector,websearch_to_tsquery('simple',left(p_query,500)))::double precision +
 case when c.embedding is not null and p_embedding is not null then 1-(c.embedding <=> p_embedding) else 0 end) as score
 from reader_chunks c join reader_documents d on d.id=c.document_id and d.active_revision=c.revision and d.is_public
 join reader_pages p on p.document_id=c.document_id and p.revision=c.revision and p.page_number=c.page_number
 where (p_document is null or c.document_id=p_document) and (p_page is null or c.page_number=p_page)
 and (c.search_vector @@ websearch_to_tsquery('simple',left(p_query,500)) or (p_embedding is not null and c.embedding is not null and (c.embedding <=> p_embedding)<0.16))
 ) select r.id,r.document_id,r.collection_id,r.kind,r.title,r.author,r.revision,r.page_number,r.label,r.text_content,r.score from ranked r order by r.score desc limit 6;
$$;

-- Reservations include per-minute/per-day scopes and a conservative global token budget.
create or replace function public.reader_reserve_usage(p_buckets jsonb)
returns jsonb language plpgsql security invoker set search_path=public as $$
declare b jsonb; used bigint; remaining bigint:=2147483647;
begin
 perform pg_advisory_xact_lock(hashtext('ruang-baca-chat-quota'));
 delete from chat_usage where expires_at<now();
 for b in select * from jsonb_array_elements(p_buckets) loop
  select units into used from chat_usage where bucket_key=b->>'key';
  used:=coalesce(used,0);
  if used+(b->>'units')::bigint>(b->>'limit')::bigint then return jsonb_build_object('ok',false,'remaining',0); end if;
  if b->>'scope' in ('daily','network') then remaining:=least(remaining,((b->>'limit')::bigint-used-(b->>'units')::bigint)); end if;
 end loop;
 for b in select * from jsonb_array_elements(p_buckets) loop
  insert into chat_usage(bucket_key,units,expires_at) values(b->>'key',(b->>'units')::bigint,(b->>'expires')::timestamptz)
  on conflict(bucket_key) do update set units=chat_usage.units+excluded.units;
 end loop;
 return jsonb_build_object('ok',true,'remaining',remaining);
end $$;
revoke all on function public.reader_search(text,text,text,integer),public.reader_retrieve(text,text,integer,extensions.vector),public.reader_reserve_usage(jsonb) from public,anon,authenticated;
grant execute on function public.reader_search(text,text,text,integer),public.reader_retrieve(text,text,integer,extensions.vector),public.reader_reserve_usage(jsonb) to service_role;

-- Catalogue publication/source changes invalidate an old derived version immediately.
create or replace function public.invalidate_reader_document() returns trigger language plpgsql security definer set search_path=public as $$
begin
 update reader_documents set is_public=false,updated_at=now()
 where collection_id=old.id::text and kind=case when TG_TABLE_NAME='books' then 'book' else 'thesis' end;
 if TG_OP='DELETE' then return old; end if;
 return new;
end $$;
drop trigger if exists reader_invalidate_book on public.books;
create trigger reader_invalidate_book after update or delete on public.books for each row execute function public.invalidate_reader_document();
drop trigger if exists reader_invalidate_thesis on public.theses;
create trigger reader_invalidate_thesis after update or delete on public.theses for each row execute function public.invalidate_reader_document();

create or replace function public.reader_claim_job()
returns setof public.reader_jobs language plpgsql security invoker set search_path=public as $$
declare chosen uuid;
begin
 select id into chosen from reader_jobs where status='queued' order by updated_at for update skip locked limit 1;
 if chosen is null then return; end if;
 return query update reader_jobs set status='processing',updated_at=now() where id=chosen returning *;
end $$;
revoke all on function public.reader_claim_job() from public,anon,authenticated;
grant execute on function public.reader_claim_job() to service_role;
