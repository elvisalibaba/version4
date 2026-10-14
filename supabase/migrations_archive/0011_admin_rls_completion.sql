drop policy if exists "Admin full profiles access" on public.profiles;
create policy "Admin full profiles access"
on public.profiles
for all
using (public.is_current_user_admin())
with check (public.is_current_user_admin());

drop policy if exists "Admin full orders access" on public.orders;
create policy "Admin full orders access"
on public.orders
for all
using (public.is_current_user_admin())
with check (public.is_current_user_admin());

drop policy if exists "Admin full library access" on public.library;
create policy "Admin full library access"
on public.library
for all
using (public.is_current_user_admin())
with check (public.is_current_user_admin());

do $$
begin
  if to_regclass('public.ratings') is not null then
    execute 'alter table public.ratings enable row level security';
    execute 'drop policy if exists "Admin read all ratings" on public.ratings';
    execute 'create policy "Admin read all ratings" on public.ratings for select using (public.is_current_user_admin())';
    execute 'drop policy if exists "Admin delete ratings" on public.ratings';
    execute 'create policy "Admin delete ratings" on public.ratings for delete using (public.is_current_user_admin())';
  end if;

  if to_regclass('public.highlights') is not null then
    execute 'alter table public.highlights enable row level security';
    execute 'drop policy if exists "Admin read all highlights" on public.highlights';
    execute 'create policy "Admin read all highlights" on public.highlights for select using (public.is_current_user_admin())';
    execute 'drop policy if exists "Admin delete highlights" on public.highlights';
    execute 'create policy "Admin delete highlights" on public.highlights for delete using (public.is_current_user_admin())';
  end if;
end $$;
