create or replace function public.is_current_user_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

grant execute on function public.is_current_user_admin() to authenticated;
grant execute on function public.is_current_user_admin() to anon;

drop policy if exists "Admin can view all profiles" on public.profiles;

create policy "Admin can view all profiles"
on public.profiles
for select
using (public.is_current_user_admin());
