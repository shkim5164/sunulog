-- Run once in your Supabase project's SQL Editor. Only the server's secret key has access.
begin;
create table if not exists public.sunulog_comments (
  id uuid primary key,
  seq bigint generated always as identity unique,
  post_id bigint not null check (post_id > 0),
  parent_id uuid references public.sunulog_comments(id) on delete cascade,
  anchor jsonb,
  color text not null check (color in ('amber','mint','rose','lavender')),
  author text not null check (char_length(author) between 1 and 24),
  body text not null check (char_length(body) between 1 and 2000),
  actor text not null,
  created_at timestamptz not null default now(),
  check ((parent_id is null and anchor is not null) or (parent_id is not null and anchor is null))
);
create index if not exists sunulog_comments_post_seq on public.sunulog_comments(post_id,seq);
create index if not exists sunulog_comments_parent on public.sunulog_comments(parent_id);
create table if not exists public.sunulog_comment_limits (
  actor text primary key,
  window_started timestamptz not null,
  hits integer not null
);
alter table public.sunulog_comments enable row level security;
alter table public.sunulog_comment_limits enable row level security;
revoke all on public.sunulog_comments, public.sunulog_comment_limits from anon, authenticated;
grant select, insert, update, delete on public.sunulog_comments, public.sunulog_comment_limits to service_role;
grant usage, select on sequence public.sunulog_comments_seq_seq to service_role;

create or replace function public.sunulog_add_comment(p_input jsonb, p_actor text)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare
  existing public.sunulog_comments;
  parent public.sunulog_comments;
  result public.sunulog_comments;
  rate public.sunulog_comment_limits;
  parent_uuid uuid := (p_input->>'parentId')::uuid;
begin
  perform pg_advisory_xact_lock(hashtextextended(p_actor, 0));
  select * into existing from public.sunulog_comments where id = (p_input->>'id')::uuid;
  if found then
    if existing.actor <> p_actor or existing.post_id <> (p_input->>'postId')::bigint or existing.body <> p_input->>'body' or existing.parent_id is distinct from parent_uuid then
      raise exception 'Conflicting request' using errcode = '23505';
    end if;
    return to_jsonb(existing) - 'actor';
  end if;
  if parent_uuid is not null then
    select * into parent from public.sunulog_comments where id = parent_uuid and post_id = (p_input->>'postId')::bigint and parent_id is null for key share;
    if not found then raise exception 'Missing parent' using errcode = 'P0002'; end if;
  end if;
  delete from public.sunulog_comment_limits where window_started < now() - interval '1 day';
  select * into rate from public.sunulog_comment_limits where actor = p_actor;
  if found and rate.window_started > now() - interval '1 minute' and rate.hits >= 5 then
    raise exception 'Too many comments' using errcode = 'P0429';
  end if;
  insert into public.sunulog_comment_limits as limits (actor,window_started,hits) values (p_actor,now(),1)
    on conflict (actor) do update set
      hits = case when limits.window_started <= now() - interval '1 minute' then 1 else limits.hits + 1 end,
      window_started = case when limits.window_started <= now() - interval '1 minute' then now() else limits.window_started end;
  insert into public.sunulog_comments(id,post_id,parent_id,anchor,color,author,body,actor)
    values ((p_input->>'id')::uuid,(p_input->>'postId')::bigint,parent_uuid,
      case when parent_uuid is null then p_input->'anchor' else null end,
      case when parent_uuid is null then p_input->>'color' else parent.color end,
      p_input->>'author',p_input->>'body',p_actor) returning * into result;
  return to_jsonb(result) - 'actor';
end;
$$;
revoke all on function public.sunulog_add_comment(jsonb,text) from public, anon, authenticated;
grant execute on function public.sunulog_add_comment(jsonb,text) to service_role;
commit;
