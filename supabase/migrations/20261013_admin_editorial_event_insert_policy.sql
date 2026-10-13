-- An editorial decision must be logged in the same database transaction as the book update.
-- Allow authenticated INSERT at the SQL grant level; RLS still restricts writes to verified admins.
GRANT INSERT ON TABLE public.book_editorial_events TO authenticated;
CREATE POLICY "hb_admin_editorial_event_insert"
ON public.book_editorial_events
FOR INSERT TO authenticated
WITH CHECK (
  public.is_current_user_admin()
  AND actor_id = (SELECT auth.uid())
);
