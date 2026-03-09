update public.profiles p
set role = 'author'
from auth.users u
where p.id = u.id
  and p.role = 'reader'
  and coalesce(u.raw_user_meta_data->>'role', 'reader') = 'author';
