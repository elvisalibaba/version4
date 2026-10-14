create table if not exists public.mobile_app_configs (
  scope text primary key default 'global' check (scope = 'global'),
  app_name text not null default 'Holistique Stores',
  hero_title text not null default 'Telecharger Holistique Stores',
  hero_description text not null default 'Installez l application Android et activez 7 jours offerts sur tous les contenus numeriques, sans engagement.',
  android_cta_label text not null default 'Telecharger l APK',
  apk_path text,
  apk_file_name text,
  version_label text,
  release_notes text,
  is_public boolean not null default false,
  trial_enabled boolean not null default true,
  trial_days integer not null default 7 check (trial_days between 1 and 30),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id) on delete set null
);

insert into public.mobile_app_configs (scope)
values ('global')
on conflict (scope) do nothing;

create table if not exists public.mobile_app_trial_grants (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  source text not null default 'web_download',
  granted_at timestamptz not null default now(),
  expires_at timestamptz not null,
  status text not null default 'active' check (status in ('active', 'expired', 'revoked')),
  claimed_download_count integer not null default 1 check (claimed_download_count >= 1),
  last_downloaded_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists mobile_app_trial_grants_status_idx on public.mobile_app_trial_grants(status);
create index if not exists mobile_app_trial_grants_expires_at_idx on public.mobile_app_trial_grants(expires_at);

drop trigger if exists trg_mobile_app_trial_grants_updated_at on public.mobile_app_trial_grants;
create trigger trg_mobile_app_trial_grants_updated_at
before update on public.mobile_app_trial_grants
for each row execute procedure public.set_updated_at();

alter table public.mobile_app_configs enable row level security;
alter table public.mobile_app_trial_grants enable row level security;

drop policy if exists "Anyone can view public mobile app config" on public.mobile_app_configs;
create policy "Anyone can view public mobile app config"
on public.mobile_app_configs
for select
using (is_public = true or public.is_current_user_admin());

drop policy if exists "Admin full mobile app config access" on public.mobile_app_configs;
create policy "Admin full mobile app config access"
on public.mobile_app_configs
for all
using (public.is_current_user_admin())
with check (public.is_current_user_admin());

drop policy if exists "Readers can view own mobile app trial" on public.mobile_app_trial_grants;
create policy "Readers can view own mobile app trial"
on public.mobile_app_trial_grants
for select
using (auth.uid() = user_id);

drop policy if exists "Admin full mobile app trial access" on public.mobile_app_trial_grants;
create policy "Admin full mobile app trial access"
on public.mobile_app_trial_grants
for all
using (public.is_current_user_admin())
with check (public.is_current_user_admin());

create or replace function public.claim_current_user_mobile_app_trial(
  p_trial_days integer default 7,
  p_source text default 'web_download'
)
returns public.mobile_app_trial_grants
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  normalized_days integer := greatest(1, least(30, coalesce(p_trial_days, 7)));
  existing_grant public.mobile_app_trial_grants%rowtype;
begin
  if current_user_id is null then
    raise exception 'Authentication required to claim mobile app trial.';
  end if;

  select *
  into existing_grant
  from public.mobile_app_trial_grants
  where user_id = current_user_id;

  if not found then
    insert into public.mobile_app_trial_grants (
      user_id,
      source,
      granted_at,
      expires_at,
      status,
      claimed_download_count,
      last_downloaded_at
    )
    values (
      current_user_id,
      coalesce(nullif(trim(p_source), ''), 'web_download'),
      now(),
      now() + make_interval(days => normalized_days),
      'active',
      1,
      now()
    )
    returning *
    into existing_grant;

    return existing_grant;
  end if;

  update public.mobile_app_trial_grants
  set
    source = coalesce(nullif(trim(p_source), ''), source),
    status = case
      when status = 'revoked' then 'revoked'
      when expires_at <= now() then 'expired'
      else status
    end,
    claimed_download_count = greatest(claimed_download_count, 1) + 1,
    last_downloaded_at = now(),
    updated_at = now()
  where user_id = current_user_id
  returning *
  into existing_grant;

  return existing_grant;
end;
$$;

grant execute on function public.claim_current_user_mobile_app_trial(integer, text) to authenticated;

create or replace function public.user_has_access_to_book(p_user_id uuid, p_book_id uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  has_access boolean;
begin
  if p_user_id is null or p_book_id is null then
    return false;
  end if;

  select exists (
    select 1
    from public.books b
    join public.library l on l.book_id = b.id
    where b.id = p_book_id
      and b.status = 'published'
      and coalesce(b.copyright_status, 'clear') <> 'blocked'
      and l.user_id = p_user_id
      and l.access_type in ('purchase', 'free')
  )
  or exists (
    select 1
    from public.books b
    join public.subscription_plan_books spb on spb.book_id = b.id
    join public.user_subscriptions us on us.plan_id = spb.plan_id
    where b.id = p_book_id
      and b.status = 'published'
      and coalesce(b.copyright_status, 'clear') <> 'blocked'
      and us.user_id = p_user_id
      and us.status = 'active'
      and (us.expires_at is null or us.expires_at > now())
  )
  or exists (
    select 1
    from public.books b
    where b.id = p_book_id
      and b.status = 'published'
      and coalesce(b.copyright_status, 'clear') <> 'blocked'
      and b.is_single_sale_enabled = true
      and coalesce(
        (
          select bf.price
          from public.book_formats bf
          where bf.book_id = b.id
            and bf.is_published = true
            and bf.format in ('holistique_store', 'ebook')
          order by case bf.format
            when 'holistique_store' then 0
            when 'ebook' then 1
            else 99
          end
          limit 1
        ),
        b.price,
        0
      ) <= 0
  )
  or exists (
    select 1
    from public.books b
    where b.id = p_book_id
      and b.status = 'published'
      and coalesce(b.copyright_status, 'clear') <> 'blocked'
      and exists (
        select 1
        from public.mobile_app_trial_grants matg
        where matg.user_id = p_user_id
          and matg.status = 'active'
          and matg.expires_at > now()
      )
      and exists (
        select 1
        from public.book_formats bf
        where bf.book_id = b.id
          and bf.is_published = true
          and bf.format in ('holistique_store', 'ebook')
      )
  )
  into has_access;

  return coalesce(has_access, false);
end;
$$;

grant execute on function public.user_has_access_to_book(uuid, uuid) to authenticated;
grant execute on function public.user_has_access_to_book(uuid, uuid) to anon;
