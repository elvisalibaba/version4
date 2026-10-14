-- ANNULATION de supabase/migrations/20261014150000_payment_order_ref_and_create_order.sql
-- Refusée si des commandes ont déjà été payées ou passées en needs_review depuis : à arbitrer à la main.
BEGIN;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.orders WHERE payment_status = 'needs_review'
                                            OR (payment_order_ref IS NOT NULL AND payment_status <> 'pending')) THEN
    RAISE EXCEPTION 'Des commandes EasyPay utilisent déjà la nouvelle référence : annulation manuelle requise';
  END IF;
END
$$;

-- Anciens essais repassés en pending (traces d'audit conservées : journal en insertion seule).
UPDATE public.orders
   SET payment_status = 'pending',
       payment_provider_status = replace(payment_provider_status, ':EXPIRED_LEGACY_TEST', ''),
       payment_metadata = payment_metadata - 'expired_at' - 'expired_reason'
 WHERE payment_status = 'expired' AND payment_metadata ? 'expired_reason';

DROP FUNCTION IF EXISTS public.hb_create_order(uuid, jsonb, text, text);
DROP FUNCTION IF EXISTS public.hb_new_payment_order_ref();
DROP INDEX IF EXISTS public.orders_pending_created_idx;
DROP INDEX IF EXISTS public.orders_payment_order_ref_uidx;
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_payment_order_ref_format;
ALTER TABLE public.orders DROP COLUMN IF EXISTS payment_order_ref;
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_payment_status_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_payment_status_check
  CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded'));

-- Version d'origine (baseline 20261014090000), search_path vide conservé.
CREATE OR REPLACE FUNCTION "public"."_sync_library_access_for_order"("p_order_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  v_order public.orders%rowtype;
  v_purchase_date timestamptz;
begin
  if p_order_id is null then
    return;
  end if;

  select *
  into v_order
  from public.orders o
  where o.id = p_order_id;

  if not found or v_order.payment_status <> 'paid' then
    return;
  end if;

  v_purchase_date := coalesce(v_order.payment_verified_at, v_order.created_at, now());

  insert into public.library as l (
    user_id,
    book_id,
    access_type,
    purchased_at,
    subscription_id
  )
  select
    v_order.user_id,
    oi.book_id,
    'purchase',
    v_purchase_date,
    null
  from public.order_items oi
  where oi.order_id = v_order.id
    and coalesce(oi.book_format, 'ebook') in ('holistique_store', 'ebook')
  on conflict (user_id, book_id) do update
    set
      access_type = 'purchase',
      subscription_id = null,
      purchased_at = case
        when l.purchased_at is null then excluded.purchased_at
        else least(l.purchased_at, excluded.purchased_at)
      end;
end;
$$;
REVOKE ALL ON FUNCTION public._sync_library_access_for_order(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public._sync_library_access_for_order(uuid) TO service_role;

COMMIT;
