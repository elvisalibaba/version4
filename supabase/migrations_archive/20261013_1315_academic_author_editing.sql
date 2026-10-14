-- Supabase / HolisticBooks - align academic taxonomy editing and profile avatar
BEGIN;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url text;
GRANT UPDATE (avatar_url) ON public.profiles TO authenticated;

-- Taxonomy reference data can be maintained only by authenticated admins.
GRANT INSERT, UPDATE, DELETE ON public.academic_taxonomies TO authenticated;
CREATE POLICY "hb_academic_taxonomy_admin_write" ON public.academic_taxonomies
FOR ALL TO authenticated
USING (public.is_current_user_admin())
WITH CHECK (public.is_current_user_admin());

-- Authors may classify ONLY their own books; admins may classify all books.
GRANT SELECT, INSERT, DELETE ON public.book_academic_taxonomy TO authenticated;
CREATE POLICY "hb_academic_link_owner_or_admin" ON public.book_academic_taxonomy
FOR ALL TO authenticated
USING (
  public.is_current_user_admin()
  OR EXISTS (SELECT 1 FROM public.books b
             WHERE b.id = book_id AND b.author_id = (SELECT auth.uid()))
)
WITH CHECK (
  public.is_current_user_admin()
  OR EXISTS (SELECT 1 FROM public.books b
             WHERE b.id = book_id AND b.author_id = (SELECT auth.uid()))
);
COMMIT;