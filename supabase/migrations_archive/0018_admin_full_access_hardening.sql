drop policy if exists "Admin full order items access" on public.order_items;
drop policy if exists "Admin sees all order items" on public.order_items;
create policy "Admin full order items access"
on public.order_items
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

  if to_regclass('public.book_engagement_events') is not null then
    execute 'alter table public.book_engagement_events enable row level security';
    execute 'drop policy if exists "Admins can read book engagement events" on public.book_engagement_events';
    execute 'drop policy if exists "Admin full book engagement events access" on public.book_engagement_events';
    execute 'create policy "Admin full book engagement events access" on public.book_engagement_events for all using (public.is_current_user_admin()) with check (public.is_current_user_admin())';
  end if;

  if to_regclass('storage.objects') is not null then
    execute 'drop policy if exists "Admin full storage books access" on storage.objects';
    execute 'create policy "Admin full storage books access" on storage.objects for all to authenticated using (bucket_id = ''books'' and public.is_current_user_admin()) with check (bucket_id = ''books'' and public.is_current_user_admin())';
  end if;
end $$;
