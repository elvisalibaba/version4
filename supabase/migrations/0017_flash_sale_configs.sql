create table if not exists public.flash_sale_configs (
  scope text primary key default 'global',
  selected_book_ids uuid[] not null default '{}',
  discount_percentage integer not null default 20,
  updated_at timestamptz not null default now(),
  constraint flash_sale_configs_scope_check check (scope = 'global'),
  constraint flash_sale_configs_discount_percentage_check check (discount_percentage between 0 and 90)
);

alter table public.flash_sale_configs enable row level security;

drop policy if exists "Anyone can view flash sale configs" on public.flash_sale_configs;
create policy "Anyone can view flash sale configs"
on public.flash_sale_configs
for select
using (true);

drop policy if exists "Admin full flash sale configs access" on public.flash_sale_configs;
create policy "Admin full flash sale configs access"
on public.flash_sale_configs
for all
using (public.is_current_user_admin())
with check (public.is_current_user_admin());
