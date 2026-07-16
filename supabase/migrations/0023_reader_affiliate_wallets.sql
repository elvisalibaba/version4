alter table public.profiles
  add column if not exists referred_by_affiliate_user_id uuid,
  add column if not exists referred_by_affiliate_code text,
  add column if not exists affiliate_source_type text,
  add column if not exists affiliate_source_book_id uuid,
  add column if not exists affiliate_source_plan_id uuid;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_referred_by_affiliate_user_id_fkey'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_referred_by_affiliate_user_id_fkey
      foreign key (referred_by_affiliate_user_id) references public.profiles(id) on delete set null;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_affiliate_source_book_id_fkey'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_affiliate_source_book_id_fkey
      foreign key (affiliate_source_book_id) references public.books(id) on delete set null;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_affiliate_source_plan_id_fkey'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_affiliate_source_plan_id_fkey
      foreign key (affiliate_source_plan_id) references public.subscription_plans(id) on delete set null;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_affiliate_source_type_check'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_affiliate_source_type_check
      check (affiliate_source_type in ('book', 'plan') or affiliate_source_type is null);
  end if;
end $$;

create table if not exists public.reader_affiliate_profiles (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  affiliate_code text not null unique,
  commission_rate numeric(5,4) not null default 0.0200 check (commission_rate >= 0 and commission_rate <= 1),
  wallet_balance numeric(12,2) not null default 0 check (wallet_balance >= 0),
  lifetime_credited numeric(12,2) not null default 0 check (lifetime_credited >= 0),
  currency_code text not null default 'USD',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.affiliate_wallet_transactions (
  id uuid primary key default uuid_generate_v4(),
  affiliate_user_id uuid not null references public.profiles(id) on delete cascade,
  referred_user_id uuid not null references public.profiles(id) on delete cascade,
  subscription_id uuid not null unique references public.user_subscriptions(id) on delete cascade,
  plan_id uuid not null references public.subscription_plans(id) on delete restrict,
  source_type text not null check (source_type in ('book', 'plan')),
  source_book_id uuid references public.books(id) on delete set null,
  source_plan_id uuid references public.subscription_plans(id) on delete set null,
  commission_rate numeric(5,4) not null default 0.0200 check (commission_rate >= 0 and commission_rate <= 1),
  subscription_amount numeric(10,2) not null check (subscription_amount >= 0),
  commission_amount numeric(10,2) not null check (commission_amount >= 0),
  currency_code text not null default 'USD',
  status text not null default 'credited' check (status in ('pending', 'credited', 'reversed')),
  created_at timestamptz not null default now()
);

alter table public.user_subscriptions
  add column if not exists affiliate_user_id uuid,
  add column if not exists affiliate_code_used text,
  add column if not exists affiliate_source_type text,
  add column if not exists affiliate_source_book_id uuid,
  add column if not exists affiliate_source_plan_id uuid,
  add column if not exists affiliate_commission_rate numeric(5,4) not null default 0.0200,
  add column if not exists affiliate_commission_amount numeric(10,2);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'user_subscriptions_affiliate_user_id_fkey'
      and conrelid = 'public.user_subscriptions'::regclass
  ) then
    alter table public.user_subscriptions
      add constraint user_subscriptions_affiliate_user_id_fkey
      foreign key (affiliate_user_id) references public.profiles(id) on delete set null;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'user_subscriptions_affiliate_source_book_id_fkey'
      and conrelid = 'public.user_subscriptions'::regclass
  ) then
    alter table public.user_subscriptions
      add constraint user_subscriptions_affiliate_source_book_id_fkey
      foreign key (affiliate_source_book_id) references public.books(id) on delete set null;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'user_subscriptions_affiliate_source_plan_id_fkey'
      and conrelid = 'public.user_subscriptions'::regclass
  ) then
    alter table public.user_subscriptions
      add constraint user_subscriptions_affiliate_source_plan_id_fkey
      foreign key (affiliate_source_plan_id) references public.subscription_plans(id) on delete set null;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'user_subscriptions_affiliate_source_type_check'
      and conrelid = 'public.user_subscriptions'::regclass
  ) then
    alter table public.user_subscriptions
      add constraint user_subscriptions_affiliate_source_type_check
      check (affiliate_source_type in ('book', 'plan') or affiliate_source_type is null);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'user_subscriptions_affiliate_commission_rate_check'
      and conrelid = 'public.user_subscriptions'::regclass
  ) then
    alter table public.user_subscriptions
      add constraint user_subscriptions_affiliate_commission_rate_check
      check (affiliate_commission_rate >= 0 and affiliate_commission_rate <= 1);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'user_subscriptions_affiliate_commission_amount_check'
      and conrelid = 'public.user_subscriptions'::regclass
  ) then
    alter table public.user_subscriptions
      add constraint user_subscriptions_affiliate_commission_amount_check
      check (affiliate_commission_amount is null or affiliate_commission_amount >= 0);
  end if;
end $$;

create index if not exists profiles_referred_by_affiliate_user_id_idx on public.profiles(referred_by_affiliate_user_id);
create index if not exists profiles_referred_by_affiliate_code_idx on public.profiles(referred_by_affiliate_code);
create index if not exists profiles_affiliate_source_book_id_idx on public.profiles(affiliate_source_book_id);
create index if not exists profiles_affiliate_source_plan_id_idx on public.profiles(affiliate_source_plan_id);
create index if not exists reader_affiliate_profiles_affiliate_code_idx on public.reader_affiliate_profiles(affiliate_code);
create index if not exists affiliate_wallet_transactions_affiliate_user_id_idx on public.affiliate_wallet_transactions(affiliate_user_id);
create index if not exists affiliate_wallet_transactions_referred_user_id_idx on public.affiliate_wallet_transactions(referred_user_id);
create index if not exists affiliate_wallet_transactions_plan_id_idx on public.affiliate_wallet_transactions(plan_id);
create index if not exists user_subscriptions_affiliate_user_id_idx on public.user_subscriptions(affiliate_user_id);

drop trigger if exists trg_reader_affiliate_profiles_updated_at on public.reader_affiliate_profiles;
create trigger trg_reader_affiliate_profiles_updated_at
before update on public.reader_affiliate_profiles
for each row execute procedure public.set_updated_at();

create or replace function public.safe_uuid(p_value text)
returns uuid
language plpgsql
immutable
as $$
begin
  if p_value is null or btrim(p_value) = '' then
    return null;
  end if;

  return btrim(p_value)::uuid;
exception
  when others then
    return null;
end;
$$;

create or replace function public.normalize_affiliate_source_type(p_value text)
returns text
language plpgsql
immutable
as $$
declare
  normalized_value text := lower(trim(coalesce(p_value, '')));
begin
  if normalized_value = 'book' then
    return 'book';
  end if;

  if normalized_value in ('plan', 'pack', 'paquet', 'bundle') then
    return 'plan';
  end if;

  return null;
end;
$$;

create or replace function public.generate_reader_affiliate_code(p_user_id uuid)
returns text
language plpgsql
stable
set search_path = public
as $$
declare
  base_code text := upper('HBL' || substr(replace(coalesce(p_user_id::text, ''), '-', ''), 1, 9));
  candidate text := base_code;
  suffix integer := 0;
begin
  if p_user_id is null then
    return null;
  end if;

  while exists (
    select 1
    from public.reader_affiliate_profiles rap
    where rap.affiliate_code = candidate
      and rap.user_id <> p_user_id
  ) loop
    suffix := suffix + 1;
    candidate := upper(base_code || lpad(suffix::text, 2, '0'));
  end loop;

  return candidate;
end;
$$;

create or replace function public.ensure_reader_affiliate_profile(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_user_id is null then
    return;
  end if;

  insert into public.reader_affiliate_profiles as rap (
    user_id,
    affiliate_code,
    commission_rate,
    currency_code,
    is_active
  )
  select
    p.id,
    public.generate_reader_affiliate_code(p.id),
    0.0200,
    'USD',
    true
  from public.profiles p
  where p.id = p_user_id
    and p.role = 'reader'
  on conflict (user_id) do update
    set
      affiliate_code = coalesce(nullif(rap.affiliate_code, ''), excluded.affiliate_code),
      updated_at = now();
end;
$$;

create or replace function public.resolve_profile_affiliate_referral()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_code text;
  resolved_affiliate_user_id uuid;
  normalized_source_type text;
begin
  normalized_code := upper(nullif(trim(coalesce(new.referred_by_affiliate_code, '')), ''));
  normalized_source_type := public.normalize_affiliate_source_type(new.affiliate_source_type);

  new.referred_by_affiliate_code := normalized_code;
  new.affiliate_source_type := normalized_source_type;

  if normalized_source_type = 'book' then
    new.affiliate_source_plan_id := null;
  elsif normalized_source_type = 'plan' then
    new.affiliate_source_book_id := null;
  else
    new.affiliate_source_book_id := null;
    new.affiliate_source_plan_id := null;
  end if;

  if normalized_code is not null then
    select rap.user_id
    into resolved_affiliate_user_id
    from public.reader_affiliate_profiles rap
    where rap.affiliate_code = normalized_code
      and rap.is_active = true
    limit 1;
  end if;

  if resolved_affiliate_user_id is not null and resolved_affiliate_user_id <> new.id then
    new.referred_by_affiliate_user_id := resolved_affiliate_user_id;
  else
    new.referred_by_affiliate_user_id := null;
  end if;

  return new;
end;
$$;

create or replace function public.handle_reader_affiliate_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role = 'reader' then
    perform public.ensure_reader_affiliate_profile(new.id);
  end if;

  return new;
end;
$$;

create or replace function public.prepare_user_subscription_affiliate_commission()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  referral_user_id uuid;
  referral_code text;
  referral_source_type text;
  referral_source_book_id uuid;
  referral_source_plan_id uuid;
  resolved_affiliate_user_id uuid;
  affiliate_profile record;
  plan_monthly_price numeric(10,2) := 0;
begin
  new.affiliate_commission_rate := coalesce(new.affiliate_commission_rate, 0.0200);

  select
    p.referred_by_affiliate_user_id,
    upper(nullif(trim(coalesce(p.referred_by_affiliate_code, '')), '')),
    public.normalize_affiliate_source_type(p.affiliate_source_type),
    p.affiliate_source_book_id,
    p.affiliate_source_plan_id
  into
    referral_user_id,
    referral_code,
    referral_source_type,
    referral_source_book_id,
    referral_source_plan_id
  from public.profiles p
  where p.id = new.user_id;

  if referral_user_id is null and referral_code is not null then
    select rap.user_id
    into resolved_affiliate_user_id
    from public.reader_affiliate_profiles rap
    where rap.affiliate_code = referral_code
      and rap.is_active = true
    limit 1;

    referral_user_id := resolved_affiliate_user_id;
  end if;

  if referral_user_id is null or referral_user_id = new.user_id then
    new.affiliate_user_id := null;
    new.affiliate_code_used := null;
    new.affiliate_source_type := null;
    new.affiliate_source_book_id := null;
    new.affiliate_source_plan_id := null;
    new.affiliate_commission_amount := null;
    return new;
  end if;

  perform public.ensure_reader_affiliate_profile(referral_user_id);

  select *
  into affiliate_profile
  from public.reader_affiliate_profiles rap
  where rap.user_id = referral_user_id
    and rap.is_active = true
  limit 1;

  if not found then
    new.affiliate_user_id := null;
    new.affiliate_code_used := null;
    new.affiliate_source_type := null;
    new.affiliate_source_book_id := null;
    new.affiliate_source_plan_id := null;
    new.affiliate_commission_amount := null;
    return new;
  end if;

  select coalesce(monthly_price, 0)
  into plan_monthly_price
  from public.subscription_plans
  where id = new.plan_id;

  if not found then
    plan_monthly_price := 0;
  end if;

  new.affiliate_user_id := referral_user_id;
  new.affiliate_code_used := referral_code;
  new.affiliate_source_type := referral_source_type;
  new.affiliate_source_book_id := case when referral_source_type = 'book' then referral_source_book_id else null end;
  new.affiliate_source_plan_id := case when referral_source_type = 'plan' then referral_source_plan_id else null end;
  new.affiliate_commission_rate := coalesce(affiliate_profile.commission_rate, new.affiliate_commission_rate, 0.0200);
  new.affiliate_commission_amount := round(plan_monthly_price::numeric * new.affiliate_commission_rate, 2);

  return new;
end;
$$;

create or replace function public.credit_affiliate_subscription_commission()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  plan_monthly_price numeric(10,2) := 0;
  plan_currency_code text := 'USD';
  inserted_count integer := 0;
  effective_source_type text;
begin
  if new.status <> 'active' then
    return new;
  end if;

  if tg_op = 'UPDATE' and coalesce(old.status, '') = 'active' then
    return new;
  end if;

  if new.affiliate_user_id is null or coalesce(new.affiliate_commission_amount, 0) <= 0 then
    return new;
  end if;

  perform public.ensure_reader_affiliate_profile(new.affiliate_user_id);

  select
    coalesce(monthly_price, 0),
    coalesce(currency_code, 'USD')
  into
    plan_monthly_price,
    plan_currency_code
  from public.subscription_plans
  where id = new.plan_id;

  if not found then
    plan_monthly_price := 0;
    plan_currency_code := 'USD';
  end if;

  effective_source_type := case
    when public.normalize_affiliate_source_type(new.affiliate_source_type) is not null then public.normalize_affiliate_source_type(new.affiliate_source_type)
    when new.affiliate_source_book_id is not null then 'book'
    else 'plan'
  end;

  insert into public.affiliate_wallet_transactions (
    affiliate_user_id,
    referred_user_id,
    subscription_id,
    plan_id,
    source_type,
    source_book_id,
    source_plan_id,
    commission_rate,
    subscription_amount,
    commission_amount,
    currency_code,
    status
  )
  values (
    new.affiliate_user_id,
    new.user_id,
    new.id,
    new.plan_id,
    effective_source_type,
    case when effective_source_type = 'book' then new.affiliate_source_book_id else null end,
    case when effective_source_type = 'plan' then new.affiliate_source_plan_id else null end,
    coalesce(new.affiliate_commission_rate, 0.0200),
    plan_monthly_price,
    coalesce(new.affiliate_commission_amount, round(plan_monthly_price::numeric * coalesce(new.affiliate_commission_rate, 0.0200), 2)),
    plan_currency_code,
    'credited'
  )
  on conflict (subscription_id) do nothing;

  get diagnostics inserted_count = row_count;

  if inserted_count > 0 then
    update public.reader_affiliate_profiles
    set
      wallet_balance = wallet_balance + coalesce(new.affiliate_commission_amount, 0),
      lifetime_credited = lifetime_credited + coalesce(new.affiliate_commission_amount, 0),
      currency_code = coalesce(plan_currency_code, currency_code, 'USD'),
      updated_at = now()
    where user_id = new.affiliate_user_id;
  end if;

  return new;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  safe_role text;
  first_name_value text;
  last_name_value text;
  fallback_name text;
  full_name text;
  favorite_categories_value text[] := '{}'::text[];
  marketing_opt_in_value boolean := false;
  author_profile_payload jsonb := '{}'::jsonb;
  author_genres_value text[] := '{}'::text[];
  referred_by_affiliate_code_value text;
  affiliate_source_type_value text;
  affiliate_source_book_id_value uuid;
  affiliate_source_plan_id_value uuid;
begin
  safe_role := case
    when coalesce(new.raw_user_meta_data->>'role', 'reader') = 'author' then 'author'
    else 'reader'
  end;

  first_name_value := nullif(coalesce(new.raw_user_meta_data->>'first_name', ''), '');
  last_name_value := nullif(coalesce(new.raw_user_meta_data->>'last_name', ''), '');
  fallback_name := nullif(coalesce(new.raw_user_meta_data->>'name', ''), '');
  full_name := nullif(trim(concat_ws(' ', first_name_value, last_name_value)), '');

  if jsonb_typeof(new.raw_user_meta_data->'favorite_categories') = 'array' then
    favorite_categories_value := array(
      select jsonb_array_elements_text(new.raw_user_meta_data->'favorite_categories')
    );
  end if;

  marketing_opt_in_value := coalesce((new.raw_user_meta_data->>'marketing_opt_in')::boolean, false);
  author_profile_payload := coalesce(new.raw_user_meta_data->'author_profile', '{}'::jsonb);
  referred_by_affiliate_code_value := upper(nullif(coalesce(new.raw_user_meta_data->>'referred_by_affiliate_code', ''), ''));
  affiliate_source_type_value := public.normalize_affiliate_source_type(new.raw_user_meta_data->>'affiliate_source_type');
  affiliate_source_book_id_value := case
    when affiliate_source_type_value = 'book' then public.safe_uuid(new.raw_user_meta_data->>'affiliate_source_book_id')
    else null
  end;
  affiliate_source_plan_id_value := case
    when affiliate_source_type_value = 'plan' then coalesce(
      public.safe_uuid(new.raw_user_meta_data->>'affiliate_source_plan_id'),
      public.safe_uuid(new.raw_user_meta_data->>'affiliate_source_pack_id')
    )
    else null
  end;

  if jsonb_typeof(author_profile_payload->'genres') = 'array' then
    author_genres_value := array(
      select jsonb_array_elements_text(author_profile_payload->'genres')
    );
  end if;

  insert into public.profiles (
    id,
    email,
    name,
    role,
    first_name,
    last_name,
    phone,
    country,
    city,
    preferred_language,
    favorite_categories,
    marketing_opt_in,
    referred_by_affiliate_code,
    affiliate_source_type,
    affiliate_source_book_id,
    affiliate_source_plan_id
  )
  values (
    new.id,
    new.email,
    coalesce(full_name, fallback_name),
    safe_role,
    first_name_value,
    last_name_value,
    nullif(coalesce(new.raw_user_meta_data->>'phone', ''), ''),
    nullif(coalesce(new.raw_user_meta_data->>'country', ''), ''),
    nullif(coalesce(new.raw_user_meta_data->>'city', ''), ''),
    coalesce(nullif(coalesce(new.raw_user_meta_data->>'preferred_language', ''), ''), 'fr'),
    favorite_categories_value,
    marketing_opt_in_value,
    referred_by_affiliate_code_value,
    affiliate_source_type_value,
    affiliate_source_book_id_value,
    affiliate_source_plan_id_value
  )
  on conflict (id) do update set
    email = excluded.email,
    name = excluded.name,
    role = excluded.role,
    first_name = excluded.first_name,
    last_name = excluded.last_name,
    phone = excluded.phone,
    country = excluded.country,
    city = excluded.city,
    preferred_language = excluded.preferred_language,
    favorite_categories = excluded.favorite_categories,
    marketing_opt_in = excluded.marketing_opt_in,
    referred_by_affiliate_code = coalesce(excluded.referred_by_affiliate_code, public.profiles.referred_by_affiliate_code),
    affiliate_source_type = coalesce(excluded.affiliate_source_type, public.profiles.affiliate_source_type),
    affiliate_source_book_id = coalesce(excluded.affiliate_source_book_id, public.profiles.affiliate_source_book_id),
    affiliate_source_plan_id = coalesce(excluded.affiliate_source_plan_id, public.profiles.affiliate_source_plan_id);

  if safe_role = 'author' then
    insert into public.author_profiles (
      id,
      display_name,
      bio,
      website,
      location,
      professional_headline,
      phone,
      genres,
      publishing_goals,
      social_links
    )
    values (
      new.id,
      coalesce(
        nullif(coalesce(author_profile_payload->>'display_name', ''), ''),
        coalesce(full_name, fallback_name, 'Auteur')
      ),
      nullif(coalesce(author_profile_payload->>'bio', ''), ''),
      nullif(coalesce(author_profile_payload->>'website', ''), ''),
      nullif(
        coalesce(
          author_profile_payload->>'location',
          trim(concat_ws(', ', nullif(coalesce(new.raw_user_meta_data->>'city', ''), ''), nullif(coalesce(new.raw_user_meta_data->>'country', ''), '')))
        ),
        ''
      ),
      nullif(coalesce(author_profile_payload->>'professional_headline', ''), ''),
      nullif(coalesce(author_profile_payload->>'phone', new.raw_user_meta_data->>'phone', ''), ''),
      author_genres_value,
      nullif(coalesce(author_profile_payload->>'publishing_goals', ''), ''),
      case
        when jsonb_typeof(author_profile_payload->'social_links') = 'object' then author_profile_payload->'social_links'
        else '{}'::jsonb
      end
    )
    on conflict (id) do update set
      display_name = excluded.display_name,
      bio = excluded.bio,
      website = excluded.website,
      location = excluded.location,
      professional_headline = excluded.professional_headline,
      phone = excluded.phone,
      genres = excluded.genres,
      publishing_goals = excluded.publishing_goals,
      social_links = excluded.social_links,
      updated_at = now();
  end if;

  if safe_role = 'reader' then
    perform public.ensure_reader_affiliate_profile(new.id);
  end if;

  return new;
end;
$$;

drop trigger if exists trg_profiles_affiliate_referral on public.profiles;
create trigger trg_profiles_affiliate_referral
before insert or update of referred_by_affiliate_code, affiliate_source_type, affiliate_source_book_id, affiliate_source_plan_id
on public.profiles
for each row
execute procedure public.resolve_profile_affiliate_referral();

drop trigger if exists trg_profiles_reader_affiliate_profile on public.profiles;
create trigger trg_profiles_reader_affiliate_profile
after insert or update of role
on public.profiles
for each row
execute procedure public.handle_reader_affiliate_profile();

drop trigger if exists trg_user_subscriptions_affiliate_prepare on public.user_subscriptions;
create trigger trg_user_subscriptions_affiliate_prepare
before insert or update of user_id, plan_id, status
on public.user_subscriptions
for each row
execute procedure public.prepare_user_subscription_affiliate_commission();

drop trigger if exists trg_user_subscriptions_affiliate_credit on public.user_subscriptions;
create trigger trg_user_subscriptions_affiliate_credit
after insert or update of status
on public.user_subscriptions
for each row
execute procedure public.credit_affiliate_subscription_commission();

insert into public.reader_affiliate_profiles as rap (
  user_id,
  affiliate_code,
  commission_rate,
  currency_code,
  is_active
)
select
  p.id,
  public.generate_reader_affiliate_code(p.id),
  0.0200,
  'USD',
  true
from public.profiles p
where p.role = 'reader'
on conflict (user_id) do update
  set
    affiliate_code = coalesce(nullif(rap.affiliate_code, ''), excluded.affiliate_code),
    updated_at = now();

update public.profiles p
set
  referred_by_affiliate_code = coalesce(
    p.referred_by_affiliate_code,
    upper(nullif(coalesce(u.raw_user_meta_data->>'referred_by_affiliate_code', ''), ''))
  ),
  affiliate_source_type = coalesce(
    p.affiliate_source_type,
    public.normalize_affiliate_source_type(u.raw_user_meta_data->>'affiliate_source_type')
  ),
  affiliate_source_book_id = coalesce(
    p.affiliate_source_book_id,
    case
      when public.normalize_affiliate_source_type(u.raw_user_meta_data->>'affiliate_source_type') = 'book'
        then public.safe_uuid(u.raw_user_meta_data->>'affiliate_source_book_id')
      else null
    end
  ),
  affiliate_source_plan_id = coalesce(
    p.affiliate_source_plan_id,
    case
      when public.normalize_affiliate_source_type(u.raw_user_meta_data->>'affiliate_source_type') = 'plan'
        then coalesce(
          public.safe_uuid(u.raw_user_meta_data->>'affiliate_source_plan_id'),
          public.safe_uuid(u.raw_user_meta_data->>'affiliate_source_pack_id')
        )
      else null
    end
  )
from auth.users u
where p.id = u.id;

alter table public.reader_affiliate_profiles enable row level security;
alter table public.affiliate_wallet_transactions enable row level security;

drop policy if exists "Readers can view own affiliate profile" on public.reader_affiliate_profiles;
create policy "Readers can view own affiliate profile"
on public.reader_affiliate_profiles
for select
using (auth.uid() = user_id);

drop policy if exists "Admin full reader affiliate profiles access" on public.reader_affiliate_profiles;
create policy "Admin full reader affiliate profiles access"
on public.reader_affiliate_profiles
for all
using (public.is_current_user_admin())
with check (public.is_current_user_admin());

drop policy if exists "Readers can view own affiliate wallet transactions" on public.affiliate_wallet_transactions;
create policy "Readers can view own affiliate wallet transactions"
on public.affiliate_wallet_transactions
for select
using (auth.uid() = affiliate_user_id);

drop policy if exists "Admin full affiliate wallet transactions access" on public.affiliate_wallet_transactions;
create policy "Admin full affiliate wallet transactions access"
on public.affiliate_wallet_transactions
for all
using (public.is_current_user_admin())
with check (public.is_current_user_admin());
