-- HolisticBooks : restore missing Supabase Auth profile and protect internal maintenance RPCs.
BEGIN;

-- Historical account created before current profile trigger: reader is the least-privileged fallback.
INSERT INTO public.profiles (id,email,name,role,created_at)
SELECT u.id, u.email,
       nullif(trim(coalesce(u.raw_user_meta_data->>'name','')), ''),
       'reader',coalesce(u.created_at,now())
FROM auth.users u
WHERE u.email IS NOT NULL AND u.email <> ''
  AND NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id=u.id)
  AND NOT EXISTS (SELECT 1 FROM public.profiles p WHERE lower(p.email)=lower(u.email))
ON CONFLICT (id) DO NOTHING;

-- These internal SECURITY DEFINER helpers have no authorization checks and
-- must not be callable as public RPCs; only trusted functions/triggers invoke them.
REVOKE EXECUTE ON FUNCTION public._sync_library_access_for_order(uuid)
  FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.refresh_book_derived_stats(uuid)
  FROM PUBLIC, anon, authenticated;

COMMIT;