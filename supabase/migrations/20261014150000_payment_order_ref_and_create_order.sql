-- =============================================================================
-- HolisticBooks — Phase 3 bis (a) : commandes EasyPay
-- =============================================================================
-- 1. Statuts de paiement : + needs_review (contrôle manuel) et expired (> 48 h sans paiement).
-- 2. orders.payment_order_ref : « HB » + 12 caractères base32 (14, alphanumérique, unique),
--    seule référence envoyée à EasyPay (order_ref : 6 à 16 caractères alphanumériques).
-- 3. hb_create_order : commande + lignes en UNE transaction, prix relus en base, appelée
--    uniquement par le serveur (service_role).
-- 4. _sync_library_access_for_order : un achat payé réactive une entrée révoquée ou expirée.
-- 5. Anciens essais : commandes pending → expired, failed inchangées, trace d'audit.
-- Idempotente, transactionnelle. Annulation : supabase/rollbacks/20261014150000_payment_order_ref_and_create_order.down.sql
-- =============================================================================

BEGIN;

-- 1. Statuts ------------------------------------------------------------------
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_payment_status_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_payment_status_check
  CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded', 'needs_review', 'expired'));

-- 2. Référence EasyPay ----------------------------------------------------------
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_order_ref text;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'orders_payment_order_ref_format') THEN
    ALTER TABLE public.orders ADD CONSTRAINT orders_payment_order_ref_format
      CHECK (payment_order_ref IS NULL OR payment_order_ref ~ '^HB[A-Z2-7]{12}$');
  END IF;
END
$$;
CREATE UNIQUE INDEX IF NOT EXISTS orders_payment_order_ref_uidx
  ON public.orders (payment_order_ref) WHERE payment_order_ref IS NOT NULL;
-- Réconciliation planifiée : commandes en attente, par ancienneté.
CREATE INDEX IF NOT EXISTS orders_pending_created_idx
  ON public.orders (created_at) WHERE payment_status = 'pending';

CREATE OR REPLACE FUNCTION public.hb_new_payment_order_ref()
RETURNS text
LANGUAGE plpgsql VOLATILE
SET search_path = ''
AS $$
DECLARE
  c_alphabet CONSTANT text := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  v_bytes bytea;
  v_ref text;
BEGIN
  LOOP
    -- 256 est un multiple de 32 : tirage uniforme sur l'alphabet base32.
    v_bytes := extensions.gen_random_bytes(12);
    v_ref := 'HB';
    FOR i IN 0..11 LOOP
      v_ref := v_ref || substr(c_alphabet, (get_byte(v_bytes, i) % 32) + 1, 1);
    END LOOP;
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.orders o WHERE o.payment_order_ref = v_ref);
  END LOOP;
  RETURN v_ref;
END;
$$;
REVOKE ALL ON FUNCTION public.hb_new_payment_order_ref() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.hb_new_payment_order_ref() TO service_role;

-- 3. Création de commande -------------------------------------------------------
-- Erreurs : SQLSTATE HB422 (requête invalide), HB409 (indisponible / conflit), 42501 (appelant).
CREATE OR REPLACE FUNCTION public.hb_create_order(
  p_user_id uuid,
  p_items jsonb,
  p_currency text,
  p_source text DEFAULT 'checkout'
)
RETURNS TABLE (order_id uuid, payment_order_ref text, total_price numeric, currency_code text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  c_formats CONSTANT text[] := ARRAY['holistique_store', 'ebook', 'paperback', 'pocket', 'hardcover'];
  c_digital CONSTANT text[] := ARRAY['holistique_store', 'ebook'];
  v_item jsonb;
  v_book_id uuid;
  v_format text;
  v_quantity integer;
  v_seen text[] := ARRAY[]::text[];
  v_book record;
  v_format_row record;
  v_total numeric := 0;
  v_lines jsonb := '[]'::jsonb;
  v_order_id uuid := gen_random_uuid();
  v_ref text;
BEGIN
  -- Serveur uniquement : service_role via PostgREST, ou session SQL directe (auth.role() NULL).
  IF auth.role() IS NOT NULL AND auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'Création de commande réservée au serveur' USING ERRCODE = '42501';
  END IF;
  IF p_user_id IS NULL OR NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = p_user_id) THEN
    RAISE EXCEPTION 'Client inconnu' USING ERRCODE = 'HB422';
  END IF;
  IF p_currency NOT IN ('USD', 'CDF') THEN
    RAISE EXCEPTION 'Devise non acceptée' USING ERRCODE = 'HB422';
  END IF;
  IF jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) NOT BETWEEN 1 AND 30 THEN
    RAISE EXCEPTION 'La commande doit contenir de 1 à 30 lignes' USING ERRCODE = 'HB422';
  END IF;

  FOR v_item IN SELECT value FROM jsonb_array_elements(p_items)
  LOOP
    IF jsonb_typeof(v_item) <> 'object'
       OR (v_item ->> 'book_id') !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
       OR NOT ((v_item ->> 'book_format') = ANY (c_formats))
       OR (v_item ->> 'quantity') !~ '^[0-9]{1,3}$' THEN
      RAISE EXCEPTION 'Livre, format ou quantité invalide' USING ERRCODE = 'HB422';
    END IF;
    v_book_id := (v_item ->> 'book_id')::uuid;
    v_format := v_item ->> 'book_format';
    v_quantity := (v_item ->> 'quantity')::integer;
    -- Numérique : 1 exemplaire ; imprimé : 50 au plus.
    IF v_quantity < 1 OR v_quantity > 50 OR (v_format = ANY (c_digital) AND v_quantity > 1) THEN
      RAISE EXCEPTION 'Quantité invalide' USING ERRCODE = 'HB422';
    END IF;
    IF (v_book_id::text || ':' || v_format) = ANY (v_seen) THEN
      RAISE EXCEPTION 'Article en double' USING ERRCODE = 'HB422';
    END IF;
    v_seen := v_seen || (v_book_id::text || ':' || v_format);

    SELECT b.id, b.title, b.status, b.review_status, b.copyright_status, b.is_single_sale_enabled
      INTO v_book FROM public.books b WHERE b.id = v_book_id;
    IF NOT FOUND OR v_book.status <> 'published' OR v_book.review_status <> 'approved'
       OR v_book.copyright_status <> 'clear' OR NOT v_book.is_single_sale_enabled THEN
      RAISE EXCEPTION 'Un livre n''est pas disponible à la vente' USING ERRCODE = 'HB409';
    END IF;

    SELECT f.id, f.price, f.currency_code INTO v_format_row
      FROM public.book_formats f
     WHERE f.book_id = v_book_id AND f.format = v_format AND f.is_published
     ORDER BY f.created_at DESC NULLS LAST
     LIMIT 1;
    IF NOT FOUND OR v_format_row.currency_code <> p_currency THEN
      RAISE EXCEPTION 'Format ou devise non disponibles pour « % »', v_book.title USING ERRCODE = 'HB409';
    END IF;
    IF v_format_row.price IS NULL OR v_format_row.price <= 0 THEN
      RAISE EXCEPTION '« % » est gratuit dans ce format : aucun paiement nécessaire', v_book.title USING ERRCODE = 'HB409';
    END IF;

    IF v_format = ANY (c_digital) AND EXISTS (
      SELECT 1 FROM public.library l
       WHERE l.user_id = p_user_id AND l.book_id = v_book_id AND l.status = 'active'
         AND l.access_type IN ('purchase', 'free')
         AND (l.expires_at IS NULL OR l.expires_at > now())
    ) THEN
      RAISE EXCEPTION '« % » est déjà dans votre bibliothèque', v_book.title USING ERRCODE = 'HB409';
    END IF;

    v_total := v_total + v_format_row.price * v_quantity;
    v_lines := v_lines || jsonb_build_object(
      'book_id', v_book_id, 'book_format', v_format, 'format_id', v_format_row.id,
      'price', v_format_row.price, 'quantity', v_quantity);
  END LOOP;

  v_total := round(v_total, 2);
  IF v_total <= 0 OR v_total > 10000000 THEN
    RAISE EXCEPTION 'Montant de commande invalide' USING ERRCODE = 'HB422';
  END IF;

  v_ref := public.hb_new_payment_order_ref();
  INSERT INTO public.orders (id, user_id, total_price, currency_code, payment_status, payment_provider,
                             payment_provider_status, payment_order_ref, payment_metadata)
  VALUES (v_order_id, p_user_id, v_total, p_currency, 'pending', 'easypay', 'ORDER_PREPARED', v_ref,
          jsonb_build_object('source', left(COALESCE(p_source, 'checkout'), 40),
                             'line_count', jsonb_array_length(v_lines)));

  INSERT INTO public.order_items (order_id, book_id, book_format, format_id, price, currency_code, quantity)
  SELECT v_order_id, (l ->> 'book_id')::uuid, l ->> 'book_format', (l ->> 'format_id')::uuid,
         (l ->> 'price')::numeric, p_currency, (l ->> 'quantity')::integer
    FROM jsonb_array_elements(v_lines) AS l;

  RETURN QUERY SELECT v_order_id, v_ref, v_total, p_currency;
END;
$$;
REVOKE ALL ON FUNCTION public.hb_create_order(uuid, jsonb, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.hb_create_order(uuid, jsonb, text, text) TO service_role;

-- 4. Bibliothèque : un achat payé (ré)active l'accès ---------------------------
CREATE OR REPLACE FUNCTION public._sync_library_access_for_order(p_order_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_order public.orders%ROWTYPE;
  v_purchase_date timestamptz;
BEGIN
  IF p_order_id IS NULL THEN
    RETURN;
  END IF;
  SELECT * INTO v_order FROM public.orders o WHERE o.id = p_order_id;
  IF NOT FOUND OR v_order.payment_status <> 'paid' THEN
    RETURN;
  END IF;
  v_purchase_date := COALESCE(v_order.payment_verified_at, v_order.created_at, now());

  INSERT INTO public.library AS l (user_id, book_id, access_type, purchased_at, subscription_id,
                                   status, expires_at, granted_by_order_id)
  SELECT v_order.user_id, oi.book_id, 'purchase', v_purchase_date, NULL, 'active', NULL, v_order.id
    FROM public.order_items oi
   WHERE oi.order_id = v_order.id
     AND COALESCE(oi.book_format, 'ebook') IN ('holistique_store', 'ebook')
  ON CONFLICT (user_id, book_id) DO UPDATE
    SET access_type = 'purchase',
        subscription_id = NULL,
        status = 'active',
        expires_at = NULL,
        granted_by_order_id = EXCLUDED.granted_by_order_id,
        purchased_at = LEAST(COALESCE(l.purchased_at, EXCLUDED.purchased_at), EXCLUDED.purchased_at);
END;
$$;
REVOKE ALL ON FUNCTION public._sync_library_access_for_order(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public._sync_library_access_for_order(uuid) TO service_role;

-- 5. Anciens essais de paiement -------------------------------------------------
WITH expired AS (
  UPDATE public.orders o
     SET payment_status = 'expired',
         payment_provider_status = COALESCE(o.payment_provider_status, 'NONE') || ':EXPIRED_LEGACY_TEST',
         payment_metadata = o.payment_metadata || jsonb_build_object('expired_at', now(), 'expired_reason', 'ancien essai avant la mise en service EasyPay')
   WHERE o.payment_status = 'pending' AND o.created_at < now() - interval '48 hours'
  RETURNING o.id, o.total_price, o.currency_code, o.created_at
)
INSERT INTO public.platform_audit_events (actor_id, action, entity_type, entity_id, severity, summary, before_state, after_state, context)
SELECT NULL, 'order.expired', 'order', e.id, 'info',
       'Ancien essai de paiement passé en expired',
       jsonb_build_object('payment_status', 'pending'),
       jsonb_build_object('payment_status', 'expired', 'total_price', e.total_price, 'currency_code', e.currency_code, 'created_at', e.created_at),
       jsonb_build_object('migration', '20261014150000', 'requested_by', 'propriétaire du projet')
  FROM expired e;

INSERT INTO public.platform_audit_events (actor_id, action, entity_type, entity_id, severity, summary, before_state, after_state, context)
SELECT NULL, 'order.legacy_failed_kept', 'order', o.id, 'info',
       'Ancien essai de paiement en échec conservé tel quel',
       jsonb_build_object('payment_status', o.payment_status), NULL,
       jsonb_build_object('migration', '20261014150000', 'requested_by', 'propriétaire du projet')
  FROM public.orders o
 WHERE o.payment_status = 'failed'
   AND NOT EXISTS (SELECT 1 FROM public.platform_audit_events a
                    WHERE a.entity_id = o.id AND a.action = 'order.legacy_failed_kept');

COMMIT;
