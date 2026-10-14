alter table public.orders
  add column if not exists payment_provider text,
  add column if not exists payment_transaction_id text,
  add column if not exists payment_channel text,
  add column if not exists payment_provider_status text,
  add column if not exists payment_verified_at timestamptz,
  add column if not exists payment_metadata jsonb not null default '{}'::jsonb;

create unique index if not exists orders_payment_transaction_id_idx
  on public.orders(payment_transaction_id)
  where payment_transaction_id is not null;

create index if not exists orders_payment_provider_created_at_idx
  on public.orders(payment_provider, created_at desc);
