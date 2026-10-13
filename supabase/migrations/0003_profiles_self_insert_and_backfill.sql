create policy "Users can insert own profile"
on public.profiles
for insert
with check (auth.uid() = id);

insert into public.profiles (id, email, name, role)
select
  u.id,
  u.email,
  nullif(coalesce(u.raw_user_meta_data->>'name', ''), ''),
  coalesce(u.raw_user_meta_data->>'role', 'reader')
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null
on conflict (id) do nothing;
