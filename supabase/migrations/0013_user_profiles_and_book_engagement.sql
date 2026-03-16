alter table public.profiles
  add column if not exists first_name text,
  add column if not exists last_name text,
  add column if not exists phone text,
  add column if not exists country text,
  add column if not exists city text,
  add column if not exists preferred_language text not null default 'fr',
  add column if not exists favorite_categories text[] not null default '{}'::text[],
  add column if not exists marketing_opt_in boolean not null default false;

alter table public.author_profiles
  add column if not exists professional_headline text,
  add column if not exists phone text,
  add column if not exists genres text[] not null default '{}'::text[],
  add column if not exists publishing_goals text;

create table if not exists public.book_engagement_events (
  id uuid primary key default uuid_generate_v4(),
  book_id uuid not null references public.books(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  event_type text not null check (event_type in ('detail_view', 'reader_open', 'file_access')),
  source text,
  user_role text check (user_role in ('reader', 'author', 'admin')),
  is_authenticated boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists book_engagement_events_book_id_idx on public.book_engagement_events(book_id);
create index if not exists book_engagement_events_user_id_idx on public.book_engagement_events(user_id);
create index if not exists book_engagement_events_event_type_idx on public.book_engagement_events(event_type);
create index if not exists book_engagement_events_created_at_idx on public.book_engagement_events(created_at desc);

alter table public.book_engagement_events enable row level security;

drop policy if exists "Admins can read book engagement events" on public.book_engagement_events;
create policy "Admins can read book engagement events"
on public.book_engagement_events
for select
using (public.is_current_user_admin());

create or replace function public.track_book_engagement(
  p_book_id uuid,
  p_event_type text,
  p_source text default null,
  p_metadata jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid;
  current_user_role text;
begin
  if p_event_type not in ('detail_view', 'reader_open', 'file_access') then
    raise exception 'Unsupported book engagement event type: %', p_event_type;
  end if;

  current_user_id := auth.uid();

  if current_user_id is not null then
    select role
    into current_user_role
    from public.profiles
    where id = current_user_id;
  end if;

  insert into public.book_engagement_events (
    book_id,
    user_id,
    event_type,
    source,
    user_role,
    is_authenticated,
    metadata
  )
  values (
    p_book_id,
    current_user_id,
    p_event_type,
    p_source,
    current_user_role,
    current_user_id is not null,
    coalesce(p_metadata, '{}'::jsonb)
  );

  if p_event_type = 'detail_view' then
    update public.books
    set views_count = views_count + 1
    where id = p_book_id;
  end if;
end;
$$;

grant execute on function public.track_book_engagement(uuid, text, text, jsonb) to anon, authenticated;
