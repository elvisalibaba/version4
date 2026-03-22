create table if not exists public.book_favorites (
  user_id uuid not null references public.profiles(id) on delete cascade,
  book_id uuid not null references public.books(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, book_id)
);

create table if not exists public.affiliate_order_transactions (
  id uuid primary key default uuid_generate_v4(),
  affiliate_user_id uuid not null references public.profiles(id) on delete cascade,
  referred_user_id uuid not null references public.profiles(id) on delete cascade,
  order_id uuid not null unique references public.orders(id) on delete cascade,
  purchased_book_id uuid not null references public.books(id) on delete cascade,
  referral_source_type text check (referral_source_type in ('book', 'plan') or referral_source_type is null),
  referral_source_book_id uuid references public.books(id) on delete set null,
  referral_source_plan_id uuid references public.subscription_plans(id) on delete set null,
  commission_rate numeric(5,4) not null default 0.0200 check (commission_rate >= 0 and commission_rate <= 1),
  order_amount numeric(10,2) not null check (order_amount >= 0),
  commission_amount numeric(10,2) not null check (commission_amount >= 0),
  currency_code text not null default 'USD',
  status text not null default 'credited' check (status in ('pending', 'credited', 'reversed')),
  created_at timestamptz not null default now()
);

create index if not exists book_favorites_book_id_idx on public.book_favorites(book_id);
create index if not exists affiliate_order_transactions_affiliate_user_id_idx on public.affiliate_order_transactions(affiliate_user_id);
create index if not exists affiliate_order_transactions_referred_user_id_idx on public.affiliate_order_transactions(referred_user_id);
create index if not exists affiliate_order_transactions_purchased_book_id_idx on public.affiliate_order_transactions(purchased_book_id);

alter table public.book_favorites enable row level security;
alter table public.affiliate_order_transactions enable row level security;

create or replace function public.credit_affiliate_paid_order_commission()
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
  affiliate_profile public.reader_affiliate_profiles%rowtype;
  purchased_book_id_value uuid;
  order_amount_value numeric(10,2) := 0;
  order_currency_code_value text := 'USD';
  commission_rate_value numeric(5,4) := 0.0200;
  commission_amount_value numeric(10,2) := 0;
  inserted_count integer := 0;
  effective_source_type text;
begin
  if new.payment_status <> 'paid' then
    return new;
  end if;

  if tg_op = 'UPDATE' and coalesce(old.payment_status, '') = 'paid' then
    return new;
  end if;

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
    return new;
  end if;

  select
    oi.book_id,
    coalesce(new.total_price, oi.price, 0),
    coalesce(new.currency_code, oi.currency_code, 'USD')
  into
    purchased_book_id_value,
    order_amount_value,
    order_currency_code_value
  from public.order_items oi
  where oi.order_id = new.id
  order by oi.id
  limit 1;

  if purchased_book_id_value is null or order_amount_value <= 0 then
    return new;
  end if;

  commission_rate_value := coalesce(affiliate_profile.commission_rate, 0.0200);
  commission_amount_value := round(order_amount_value::numeric * commission_rate_value, 2);

  if commission_amount_value <= 0 then
    return new;
  end if;

  effective_source_type := case
    when public.normalize_affiliate_source_type(referral_source_type) is not null then public.normalize_affiliate_source_type(referral_source_type)
    when referral_source_book_id is not null then 'book'
    when referral_source_plan_id is not null then 'plan'
    else null
  end;

  insert into public.affiliate_order_transactions (
    affiliate_user_id,
    referred_user_id,
    order_id,
    purchased_book_id,
    referral_source_type,
    referral_source_book_id,
    referral_source_plan_id,
    commission_rate,
    order_amount,
    commission_amount,
    currency_code,
    status
  )
  values (
    referral_user_id,
    new.user_id,
    new.id,
    purchased_book_id_value,
    effective_source_type,
    case when effective_source_type = 'book' then referral_source_book_id else null end,
    case when effective_source_type = 'plan' then referral_source_plan_id else null end,
    commission_rate_value,
    order_amount_value,
    commission_amount_value,
    order_currency_code_value,
    'credited'
  )
  on conflict (order_id) do nothing;

  get diagnostics inserted_count = row_count;

  if inserted_count > 0 then
    update public.reader_affiliate_profiles
    set
      wallet_balance = wallet_balance + commission_amount_value,
      lifetime_credited = lifetime_credited + commission_amount_value,
      currency_code = coalesce(order_currency_code_value, currency_code, 'USD'),
      updated_at = now()
    where user_id = referral_user_id;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_orders_insert_affiliate_order_credit on public.orders;
create trigger trg_orders_insert_affiliate_order_credit
after insert on public.orders
for each row
when (new.payment_status = 'paid')
execute procedure public.credit_affiliate_paid_order_commission();

drop trigger if exists trg_orders_update_affiliate_order_credit on public.orders;
create trigger trg_orders_update_affiliate_order_credit
after update of payment_status on public.orders
for each row
when (old.payment_status is distinct from new.payment_status)
execute procedure public.credit_affiliate_paid_order_commission();

drop policy if exists "Readers can view own book favorites" on public.book_favorites;
create policy "Readers can view own book favorites"
on public.book_favorites
for select
using (auth.uid() = user_id);

drop policy if exists "Readers can insert own book favorites" on public.book_favorites;
create policy "Readers can insert own book favorites"
on public.book_favorites
for insert
with check (auth.uid() = user_id);

drop policy if exists "Readers can delete own book favorites" on public.book_favorites;
create policy "Readers can delete own book favorites"
on public.book_favorites
for delete
using (auth.uid() = user_id);

drop policy if exists "Admin full book favorites access" on public.book_favorites;
create policy "Admin full book favorites access"
on public.book_favorites
for all
using (public.is_current_user_admin())
with check (public.is_current_user_admin());

drop policy if exists "Readers can view own affiliate order transactions" on public.affiliate_order_transactions;
create policy "Readers can view own affiliate order transactions"
on public.affiliate_order_transactions
for select
using (auth.uid() = affiliate_user_id);

drop policy if exists "Admin full affiliate order transactions access" on public.affiliate_order_transactions;
create policy "Admin full affiliate order transactions access"
on public.affiliate_order_transactions
for all
using (public.is_current_user_admin())
with check (public.is_current_user_admin());
