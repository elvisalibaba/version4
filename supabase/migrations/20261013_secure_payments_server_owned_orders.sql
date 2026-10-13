-- Keep all payment state and purchased-library entitlements server-owned.
-- This closes legacy policies that let clients submit their own paid orders.
BEGIN;
DROP POLICY IF EXISTS "Reader creates own orders" ON public.orders;
DROP POLICY IF EXISTS "Reader inserts own order items" ON public.order_items;
DROP POLICY IF EXISTS "Reader inserts own library items" ON public.library;
REVOKE INSERT,UPDATE,DELETE,TRUNCATE ON TABLE public.orders FROM anon,authenticated;
REVOKE INSERT,UPDATE,DELETE,TRUNCATE ON TABLE public.order_items FROM anon,authenticated;
REVOKE INSERT,UPDATE,DELETE,TRUNCATE ON TABLE public.library FROM anon,authenticated;
GRANT SELECT ON TABLE public.orders,public.order_items,public.library TO authenticated;
COMMIT;