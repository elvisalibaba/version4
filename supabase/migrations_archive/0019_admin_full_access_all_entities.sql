-- Final admin hardening based on current public schema.
-- Goal: ensure admin can CRUD all back-office entities while keeping existing reader/author policies.

alter table public.profiles enable row level security;
drop policy if exists "Admin can view all profiles" on public.profiles;
drop policy if exists "Admin full profiles access" on public.profiles;
create policy "Admin full profiles access"
on public.profiles
for all
using (public.is_current_user_admin())
with check (public.is_current_user_admin());

alter table public.author_profiles enable row level security;
drop policy if exists "Admin full author profiles access" on public.author_profiles;
create policy "Admin full author profiles access"
on public.author_profiles
for all
using (public.is_current_user_admin())
with check (public.is_current_user_admin());

alter table public.books enable row level security;
drop policy if exists "Admin full books access" on public.books;
create policy "Admin full books access"
on public.books
for all
using (public.is_current_user_admin())
with check (public.is_current_user_admin());

alter table public.book_formats enable row level security;
drop policy if exists "Admin full formats access" on public.book_formats;
create policy "Admin full formats access"
on public.book_formats
for all
using (public.is_current_user_admin())
with check (public.is_current_user_admin());

alter table public.orders enable row level security;
drop policy if exists "Admin sees all orders" on public.orders;
drop policy if exists "Admin full orders access" on public.orders;
create policy "Admin full orders access"
on public.orders
for all
using (public.is_current_user_admin())
with check (public.is_current_user_admin());

alter table public.order_items enable row level security;
drop policy if exists "Admin sees all order items" on public.order_items;
drop policy if exists "Admin full order items access" on public.order_items;
create policy "Admin full order items access"
on public.order_items
for all
using (public.is_current_user_admin())
with check (public.is_current_user_admin());

alter table public.library enable row level security;
drop policy if exists "Admin sees all library rows" on public.library;
drop policy if exists "Admin full library access" on public.library;
create policy "Admin full library access"
on public.library
for all
using (public.is_current_user_admin())
with check (public.is_current_user_admin());

alter table public.subscription_plans enable row level security;
drop policy if exists "Admin full subscription plans access" on public.subscription_plans;
create policy "Admin full subscription plans access"
on public.subscription_plans
for all
using (public.is_current_user_admin())
with check (public.is_current_user_admin());

alter table public.subscription_plan_books enable row level security;
drop policy if exists "Admin full subscription mapping access" on public.subscription_plan_books;
create policy "Admin full subscription mapping access"
on public.subscription_plan_books
for all
using (public.is_current_user_admin())
with check (public.is_current_user_admin());

alter table public.user_subscriptions enable row level security;
drop policy if exists "Admin full user subscriptions access" on public.user_subscriptions;
create policy "Admin full user subscriptions access"
on public.user_subscriptions
for all
using (public.is_current_user_admin())
with check (public.is_current_user_admin());

alter table public.blog_posts enable row level security;
drop policy if exists "Admin full blog posts access" on public.blog_posts;
create policy "Admin full blog posts access"
on public.blog_posts
for all
using (public.is_current_user_admin())
with check (public.is_current_user_admin());

alter table public.flash_sale_configs enable row level security;
drop policy if exists "Admin full flash sale configs access" on public.flash_sale_configs;
create policy "Admin full flash sale configs access"
on public.flash_sale_configs
for all
using (public.is_current_user_admin())
with check (public.is_current_user_admin());

alter table public.book_engagement_events enable row level security;
drop policy if exists "Admins can read book engagement events" on public.book_engagement_events;
drop policy if exists "Admin full book engagement events access" on public.book_engagement_events;
create policy "Admin full book engagement events access"
on public.book_engagement_events
for all
using (public.is_current_user_admin())
with check (public.is_current_user_admin());

do $$
begin
  if to_regclass('public.ratings') is not null then
    execute 'alter table public.ratings enable row level security';
    execute 'drop policy if exists "Admin read all ratings" on public.ratings';
    execute 'drop policy if exists "Admin delete ratings" on public.ratings';
    execute 'drop policy if exists "Admin full ratings access" on public.ratings';
    execute 'create policy "Admin full ratings access" on public.ratings for all using (public.is_current_user_admin()) with check (public.is_current_user_admin())';
  end if;

  if to_regclass('public.highlights') is not null then
    execute 'alter table public.highlights enable row level security';
    execute 'drop policy if exists "Admin read all highlights" on public.highlights';
    execute 'drop policy if exists "Admin delete highlights" on public.highlights';
    execute 'drop policy if exists "Admin full highlights access" on public.highlights';
    execute 'create policy "Admin full highlights access" on public.highlights for all using (public.is_current_user_admin()) with check (public.is_current_user_admin())';
  end if;

  if to_regclass('storage.objects') is not null then
    execute 'drop policy if exists "Admin full storage books access" on storage.objects';
    execute 'create policy "Admin full storage books access" on storage.objects for all to authenticated using (bucket_id = ''books'' and public.is_current_user_admin()) with check (bucket_id = ''books'' and public.is_current_user_admin())';
  end if;
end $$;
