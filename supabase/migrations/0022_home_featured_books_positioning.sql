-- Manual homepage merchandising: admin chooses which books appear first on /home.

create table if not exists public.home_featured_configs (
  scope text primary key default 'global' check (scope = 'global'),
  selected_book_ids uuid[] not null default '{}'::uuid[],
  updated_at timestamp with time zone not null default now()
);

insert into public.home_featured_configs (scope)
values ('global')
on conflict (scope) do nothing;

alter table public.home_featured_configs enable row level security;

drop policy if exists "Admin full home featured configs access" on public.home_featured_configs;
create policy "Admin full home featured configs access"
on public.home_featured_configs
for all
using (public.is_current_user_admin())
with check (public.is_current_user_admin());
