BEGIN;

ALTER TABLE public.author_profiles DROP CONSTRAINT IF EXISTS author_profiles_id_fkey;

ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES public.categories(id) ON DELETE SET NULL;

ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS description text;

ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS icon text;

ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS color text;

ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0;

ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS is_featured boolean NOT NULL DEFAULT false;

ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS content_types jsonb NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE public.author_profiles ADD COLUMN IF NOT EXISTS country_code text;

ALTER TABLE public.author_profiles ADD COLUMN IF NOT EXISTS catalog_origin text NOT NULL DEFAULT 'platform';

ALTER TABLE public.author_profiles ADD COLUMN IF NOT EXISTS rights_status text NOT NULL DEFAULT 'unknown';

ALTER TABLE public.author_profiles ADD COLUMN IF NOT EXISTS is_reference_profile boolean NOT NULL DEFAULT false;

ALTER TABLE public.author_profiles ADD COLUMN IF NOT EXISTS reference_source_url text;

ALTER TABLE public.author_profiles ADD COLUMN IF NOT EXISTS rights_notes text;

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS staff_role text;

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS staff_permissions jsonb;

ALTER TABLE public.books ADD COLUMN IF NOT EXISTS publishing_house_id uuid;

ALTER TABLE public.books ADD COLUMN IF NOT EXISTS imprint_id uuid;

ALTER TABLE public.books ADD COLUMN IF NOT EXISTS reading_access_mode text NOT NULL DEFAULT 'platform_only';

ALTER TABLE public.books ADD COLUMN IF NOT EXISTS can_read_on_platform boolean NOT NULL DEFAULT true;

ALTER TABLE public.books ADD COLUMN IF NOT EXISTS allow_download boolean NOT NULL DEFAULT false;

ALTER TABLE public.books ADD COLUMN IF NOT EXISTS allow_print boolean NOT NULL DEFAULT false;

ALTER TABLE public.books ADD COLUMN IF NOT EXISTS allow_copy boolean NOT NULL DEFAULT false;

ALTER TABLE public.books ADD COLUMN IF NOT EXISTS reader_watermark_enabled boolean NOT NULL DEFAULT true;

ALTER TABLE public.books ADD COLUMN IF NOT EXISTS rights_agreement_reference text;

ALTER TABLE public.books ADD COLUMN IF NOT EXISTS reader_rights_note text;

ALTER TABLE public.books ADD COLUMN IF NOT EXISTS writing_status text;

ALTER TABLE public.books ADD COLUMN IF NOT EXISTS target_word_count integer;

ALTER TABLE public.books ADD COLUMN IF NOT EXISTS current_word_count integer;

ALTER TABLE public.books ADD COLUMN IF NOT EXISTS next_author_action text;

ALTER TABLE public.books ADD COLUMN IF NOT EXISTS editorial_deadline date;

ALTER TABLE public.books ADD COLUMN IF NOT EXISTS clicks_count integer NOT NULL DEFAULT 0;

ALTER TABLE public.ratings ADD COLUMN IF NOT EXISTS review_text text;

ALTER TABLE public.ratings ADD COLUMN IF NOT EXISTS helpful_count integer NOT NULL DEFAULT 0;

ALTER TABLE public.ratings ADD COLUMN IF NOT EXISTS is_hidden boolean NOT NULL DEFAULT false;

ALTER TABLE public.ratings ADD COLUMN IF NOT EXISTS hidden_at timestamptz;

ALTER TABLE public.ratings ADD COLUMN IF NOT EXISTS hidden_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.ratings ADD COLUMN IF NOT EXISTS moderation_note text;

ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS original_price numeric(12,2);

ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS promotion_campaign_id uuid;

CREATE TABLE IF NOT EXISTS public.publishing_houses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  legal_name text,
  slug text UNIQUE,
  description text,
  status text NOT NULL DEFAULT 'draft',
  email text,
  phone text,
  website text,
  country_code text,
  city text,
  address text,
  logo_url text,
  primary_currency text NOT NULL DEFAULT 'USD',
  brand_settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.publishing_houses ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.publishing_houses FROM PUBLIC, anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.publishing_houses TO authenticated;

CREATE POLICY "hb_admin_all" ON public.publishing_houses FOR ALL TO authenticated USING (public.is_current_user_admin()) WITH CHECK (public.is_current_user_admin());

CREATE TABLE IF NOT EXISTS public.publishing_imprints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  publishing_house_id uuid NOT NULL REFERENCES public.publishing_houses(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text UNIQUE,
  description text,
  logo_url text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.publishing_imprints ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.publishing_imprints FROM PUBLIC, anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.publishing_imprints TO authenticated;

CREATE POLICY "hb_admin_all" ON public.publishing_imprints FOR ALL TO authenticated USING (public.is_current_user_admin()) WITH CHECK (public.is_current_user_admin());

CREATE TABLE IF NOT EXISTS public.publishing_house_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  publishing_house_id uuid NOT NULL REFERENCES public.publishing_houses(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member',
  title text,
  is_active boolean NOT NULL DEFAULT true,
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(publishing_house_id,profile_id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.publishing_house_members ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.publishing_house_members FROM PUBLIC, anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.publishing_house_members TO authenticated;

CREATE POLICY "hb_admin_all" ON public.publishing_house_members FOR ALL TO authenticated USING (public.is_current_user_admin()) WITH CHECK (public.is_current_user_admin());

CREATE TABLE IF NOT EXISTS public.rights_contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id uuid REFERENCES public.books(id) ON DELETE SET NULL,
  publishing_house_id uuid REFERENCES public.publishing_houses(id) ON DELETE SET NULL,
  contract_number text,
  rights_holder_name text,
  licensor_name text,
  status text NOT NULL DEFAULT 'draft',
  territories jsonb NOT NULL DEFAULT '[]'::jsonb,
  languages jsonb NOT NULL DEFAULT '[]'::jsonb,
  permitted_media jsonb NOT NULL DEFAULT '[]'::jsonb,
  exclusive boolean NOT NULL DEFAULT false,
  starts_at date,
  ends_at date,
  royalty_terms jsonb,
  proof_path text,
  notes text,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.rights_contracts ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.rights_contracts FROM PUBLIC, anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.rights_contracts TO authenticated;

CREATE POLICY "hb_admin_all" ON public.rights_contracts FOR ALL TO authenticated USING (public.is_current_user_admin()) WITH CHECK (public.is_current_user_admin());

CREATE TABLE IF NOT EXISTS public.rights_acquisition_targets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_profile_id uuid REFERENCES public.author_profiles(id) ON DELETE SET NULL,
  title text NOT NULL,
  original_publisher text,
  isbn text,
  status text NOT NULL DEFAULT 'prospect',
  territories jsonb NOT NULL DEFAULT '[]'::jsonb,
  languages jsonb NOT NULL DEFAULT '[]'::jsonb,
  desired_media jsonb NOT NULL DEFAULT '[]'::jsonb,
  estimated_budget numeric(12,2),
  currency_code text NOT NULL DEFAULT 'USD',
  contact_name text,
  contact_email text,
  source_url text,
  next_action_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.rights_acquisition_targets ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.rights_acquisition_targets FROM PUBLIC, anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.rights_acquisition_targets TO authenticated;

CREATE POLICY "hb_admin_all" ON public.rights_acquisition_targets FOR ALL TO authenticated USING (public.is_current_user_admin()) WITH CHECK (public.is_current_user_admin());

CREATE TABLE IF NOT EXISTS public.media_editions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id uuid NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  media_type text NOT NULL,
  title text,
  language text NOT NULL DEFAULT 'fr',
  duration_seconds integer,
  narrator text,
  presenter text,
  provider text,
  storage_path text,
  streaming_url text,
  preview_url text,
  mime_type text,
  file_size_bytes bigint,
  drm_scheme text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'draft',
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.media_editions ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.media_editions FROM PUBLIC, anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.media_editions TO authenticated;

CREATE POLICY "hb_admin_all" ON public.media_editions FOR ALL TO authenticated USING (public.is_current_user_admin()) WITH CHECK (public.is_current_user_admin());

CREATE TABLE IF NOT EXISTS public.media_chapters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  media_edition_id uuid NOT NULL REFERENCES public.media_editions(id) ON DELETE CASCADE,
  position integer NOT NULL DEFAULT 0,
  title text NOT NULL,
  starts_at_second integer,
  ends_at_second integer,
  storage_path text,
  streaming_url text,
  is_preview boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.media_chapters ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.media_chapters FROM PUBLIC, anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.media_chapters TO authenticated;

CREATE POLICY "hb_admin_all" ON public.media_chapters FOR ALL TO authenticated USING (public.is_current_user_admin()) WITH CHECK (public.is_current_user_admin());

CREATE TABLE IF NOT EXISTS public.ad_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  advertiser_name text NOT NULL,
  advertiser_email text,
  name text NOT NULL,
  objective text,
  status text NOT NULL DEFAULT 'draft',
  channels jsonb NOT NULL DEFAULT '[]'::jsonb,
  budget numeric(12,2) NOT NULL DEFAULT 0,
  spent numeric(12,2) NOT NULL DEFAULT 0,
  currency_code text NOT NULL DEFAULT 'USD',
  starts_at timestamptz,
  ends_at timestamptz,
  targeting jsonb,
  frequency_cap integer,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ad_campaigns ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.ad_campaigns FROM PUBLIC, anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.ad_campaigns TO authenticated;

CREATE POLICY "hb_admin_all" ON public.ad_campaigns FOR ALL TO authenticated USING (public.is_current_user_admin()) WITH CHECK (public.is_current_user_admin());

CREATE TABLE IF NOT EXISTS public.ad_placements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  channel text,
  surface text,
  position text,
  allowed_creative_types jsonb NOT NULL DEFAULT '[]'::jsonb,
  width integer,
  height integer,
  is_active boolean NOT NULL DEFAULT true,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ad_placements ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.ad_placements FROM PUBLIC, anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.ad_placements TO authenticated;

CREATE POLICY "hb_admin_all" ON public.ad_placements FOR ALL TO authenticated USING (public.is_current_user_admin()) WITH CHECK (public.is_current_user_admin());

CREATE TABLE IF NOT EXISTS public.ad_creatives (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.ad_campaigns(id) ON DELETE CASCADE,
  title text NOT NULL,
  creative_type text,
  headline text,
  body text,
  asset_url text,
  click_url text,
  cta_label text,
  alt_text text,
  metadata jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ad_creatives ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.ad_creatives FROM PUBLIC, anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.ad_creatives TO authenticated;

CREATE POLICY "hb_admin_all" ON public.ad_creatives FOR ALL TO authenticated USING (public.is_current_user_admin()) WITH CHECK (public.is_current_user_admin());

CREATE TABLE IF NOT EXISTS public.ad_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.ad_campaigns(id) ON DELETE CASCADE,
  creative_id uuid NOT NULL REFERENCES public.ad_creatives(id) ON DELETE CASCADE,
  placement_id uuid NOT NULL REFERENCES public.ad_placements(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'draft',
  weight integer NOT NULL DEFAULT 1,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ad_assignments ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.ad_assignments FROM PUBLIC, anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.ad_assignments TO authenticated;

CREATE POLICY "hb_admin_all" ON public.ad_assignments FOR ALL TO authenticated USING (public.is_current_user_admin()) WITH CHECK (public.is_current_user_admin());

CREATE TABLE IF NOT EXISTS public.ad_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid REFERENCES public.ad_assignments(id) ON DELETE SET NULL,
  event_type text NOT NULL,
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  session_hash text,
  context jsonb,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ad_events ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.ad_events FROM PUBLIC, anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.ad_events TO authenticated;

CREATE POLICY "hb_admin_all" ON public.ad_events FOR ALL TO authenticated USING (public.is_current_user_admin()) WITH CHECK (public.is_current_user_admin());

CREATE TABLE IF NOT EXISTS public.book_distribution_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id uuid NOT NULL UNIQUE REFERENCES public.books(id) ON DELETE CASCADE,
  primary_market text NOT NULL DEFAULT 'CD',
  territory_mode text NOT NULL DEFAULT 'worldwide',
  territories jsonb NOT NULL DEFAULT '[]'::jsonb,
  sales_channels jsonb NOT NULL DEFAULT '[]'::jsonb,
  local_currency text NOT NULL DEFAULT 'USD',
  royalty_rate numeric(5,2),
  preorder_enabled boolean NOT NULL DEFAULT false,
  launch_date date,
  print_on_demand_enabled boolean NOT NULL DEFAULT false,
  local_print_enabled boolean NOT NULL DEFAULT false,
  institutional_sales_enabled boolean NOT NULL DEFAULT false,
  bookstore_distribution_enabled boolean NOT NULL DEFAULT false,
  distribution_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.book_distribution_settings ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.book_distribution_settings FROM PUBLIC, anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.book_distribution_settings TO authenticated;

CREATE POLICY "hb_admin_all" ON public.book_distribution_settings FOR ALL TO authenticated USING (public.is_current_user_admin()) WITH CHECK (public.is_current_user_admin());

CREATE TABLE IF NOT EXISTS public.author_royalty_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  currency_code text NOT NULL DEFAULT 'USD',
  pending_balance numeric(14,2) NOT NULL DEFAULT 0,
  available_balance numeric(14,2) NOT NULL DEFAULT 0,
  lifetime_earnings numeric(14,2) NOT NULL DEFAULT 0,
  lifetime_paid numeric(14,2) NOT NULL DEFAULT 0,
  minimum_payout numeric(14,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active',
  UNIQUE(user_id,currency_code),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.author_royalty_accounts ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.author_royalty_accounts FROM PUBLIC, anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.author_royalty_accounts TO authenticated;

CREATE POLICY "hb_admin_all" ON public.author_royalty_accounts FOR ALL TO authenticated USING (public.is_current_user_admin()) WITH CHECK (public.is_current_user_admin());

CREATE TABLE IF NOT EXISTS public.author_royalty_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  book_id uuid REFERENCES public.books(id) ON DELETE SET NULL,
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  order_item_id uuid REFERENCES public.order_items(id) ON DELETE SET NULL,
  source text,
  gross_amount numeric(14,2) NOT NULL DEFAULT 0,
  printing_cost numeric(14,2) NOT NULL DEFAULT 0,
  platform_fee numeric(14,2) NOT NULL DEFAULT 0,
  tax_withholding numeric(14,2) NOT NULL DEFAULT 0,
  royalty_rate numeric(5,2),
  net_royalty numeric(14,2) NOT NULL DEFAULT 0,
  currency_code text NOT NULL DEFAULT 'USD',
  status text NOT NULL DEFAULT 'pending',
  earned_at timestamptz NOT NULL DEFAULT now(),
  payable_at timestamptz,
  paid_at timestamptz,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.author_royalty_transactions ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.author_royalty_transactions FROM PUBLIC, anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.author_royalty_transactions TO authenticated;

CREATE POLICY "hb_admin_all" ON public.author_royalty_transactions FOR ALL TO authenticated USING (public.is_current_user_admin()) WITH CHECK (public.is_current_user_admin());

CREATE TABLE IF NOT EXISTS public.author_payout_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  method text NOT NULL,
  provider text,
  country_code text NOT NULL DEFAULT 'CD',
  currency_code text NOT NULL DEFAULT 'USD',
  account_name text NOT NULL,
  account_identifier text,
  is_default boolean NOT NULL DEFAULT false,
  is_verified boolean NOT NULL DEFAULT false,
  verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.author_payout_accounts ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.author_payout_accounts FROM PUBLIC, anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.author_payout_accounts TO authenticated;

CREATE POLICY "hb_admin_all" ON public.author_payout_accounts FOR ALL TO authenticated USING (public.is_current_user_admin()) WITH CHECK (public.is_current_user_admin());

CREATE TABLE IF NOT EXISTS public.author_payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  payout_account_id uuid REFERENCES public.author_payout_accounts(id) ON DELETE SET NULL,
  amount numeric(14,2) NOT NULL CHECK(amount>0),
  currency_code text NOT NULL DEFAULT 'USD',
  status text NOT NULL DEFAULT 'requested',
  provider_reference text,
  notes text,
  requested_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.author_payouts ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.author_payouts FROM PUBLIC, anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.author_payouts TO authenticated;

CREATE POLICY "hb_admin_all" ON public.author_payouts FOR ALL TO authenticated USING (public.is_current_user_admin()) WITH CHECK (public.is_current_user_admin());

CREATE TABLE IF NOT EXISTS public.book_manuscript_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id uuid NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  version_number integer NOT NULL DEFAULT 1,
  file_path text NOT NULL,
  file_format text,
  file_size bigint,
  status text NOT NULL DEFAULT 'draft',
  change_summary text,
  UNIQUE(book_id,version_number),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.book_manuscript_versions ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.book_manuscript_versions FROM PUBLIC, anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.book_manuscript_versions TO authenticated;

CREATE POLICY "hb_admin_all" ON public.book_manuscript_versions FOR ALL TO authenticated USING (public.is_current_user_admin()) WITH CHECK (public.is_current_user_admin());

CREATE TABLE IF NOT EXISTS public.promotion_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  internal_code text UNIQUE,
  headline text,
  description text,
  discount_type text NOT NULL DEFAULT 'percentage',
  discount_value numeric(12,2) NOT NULL DEFAULT 0,
  currency_code text NOT NULL DEFAULT 'USD',
  selected_book_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  channels jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_active boolean NOT NULL DEFAULT false,
  priority integer NOT NULL DEFAULT 0,
  starts_at timestamptz,
  ends_at timestamptz,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.promotion_campaigns ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.promotion_campaigns FROM PUBLIC, anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.promotion_campaigns TO authenticated;

CREATE POLICY "hb_admin_all" ON public.promotion_campaigns FOR ALL TO authenticated USING (public.is_current_user_admin()) WITH CHECK (public.is_current_user_admin());

CREATE TABLE IF NOT EXISTS public.publishing_review_cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id uuid REFERENCES public.books(id) ON DELETE SET NULL,
  author_id uuid REFERENCES public.author_profiles(id) ON DELETE SET NULL,
  opened_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  assigned_to uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  case_number text UNIQUE,
  case_type text NOT NULL DEFAULT 'metadata',
  severity text NOT NULL DEFAULT 'info',
  status text NOT NULL DEFAULT 'open',
  reason_code text,
  title text NOT NULL,
  explanation text,
  required_action text,
  author_response text,
  resolution_note text,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.publishing_review_cases ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.publishing_review_cases FROM PUBLIC, anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.publishing_review_cases TO authenticated;

CREATE POLICY "hb_admin_all" ON public.publishing_review_cases FOR ALL TO authenticated USING (public.is_current_user_admin()) WITH CHECK (public.is_current_user_admin());

CREATE TABLE IF NOT EXISTS public.promotion_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  promotion_campaign_id uuid REFERENCES public.promotion_campaigns(id) ON DELETE SET NULL,
  book_id uuid REFERENCES public.books(id) ON DELETE SET NULL,
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  event_type text NOT NULL,
  channel text,
  revenue_amount numeric(14,2),
  currency_code text,
  metadata jsonb,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.promotion_events ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.promotion_events FROM PUBLIC, anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.promotion_events TO authenticated;

CREATE POLICY "hb_admin_all" ON public.promotion_events FOR ALL TO authenticated USING (public.is_current_user_admin()) WITH CHECK (public.is_current_user_admin());

CREATE TABLE IF NOT EXISTS public.platform_audit_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  severity text NOT NULL DEFAULT 'info',
  summary text,
  before_state jsonb,
  after_state jsonb,
  context jsonb,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.platform_audit_events ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.platform_audit_events FROM PUBLIC, anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.platform_audit_events TO authenticated;

CREATE POLICY "hb_admin_all" ON public.platform_audit_events FOR ALL TO authenticated USING (public.is_current_user_admin()) WITH CHECK (public.is_current_user_admin());

CREATE TABLE IF NOT EXISTS public.book_market_prices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id uuid NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  country_code text NOT NULL,
  currency_code text NOT NULL,
  list_price numeric(14,2) NOT NULL CHECK(list_price>=0),
  is_active boolean NOT NULL DEFAULT true,
  starts_at timestamptz,
  ends_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.book_market_prices ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.book_market_prices FROM PUBLIC, anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.book_market_prices TO authenticated;

CREATE POLICY "hb_admin_all" ON public.book_market_prices FOR ALL TO authenticated USING (public.is_current_user_admin()) WITH CHECK (public.is_current_user_admin());

CREATE TABLE IF NOT EXISTS public.book_reader_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  book_id uuid NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  token_hash text NOT NULL,
  device_fingerprint text,
  client_type text NOT NULL DEFAULT 'web',
  ip_hash text,
  expires_at timestamptz NOT NULL,
  last_used_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.book_reader_sessions ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.book_reader_sessions FROM PUBLIC, anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.book_reader_sessions TO authenticated;

CREATE POLICY "hb_admin_all" ON public.book_reader_sessions FOR ALL TO authenticated USING (public.is_current_user_admin()) WITH CHECK (public.is_current_user_admin());

ALTER TABLE public.books ADD CONSTRAINT books_publishing_house_fk FOREIGN KEY (publishing_house_id) REFERENCES public.publishing_houses(id) ON DELETE SET NULL;

ALTER TABLE public.books ADD CONSTRAINT books_imprint_fk FOREIGN KEY (imprint_id) REFERENCES public.publishing_imprints(id) ON DELETE SET NULL;

ALTER TABLE public.order_items ADD CONSTRAINT order_items_promotion_fk FOREIGN KEY (promotion_campaign_id) REFERENCES public.promotion_campaigns(id) ON DELETE SET NULL;

CREATE POLICY "hb_read_active_publishing_houses" ON public.publishing_houses FOR SELECT TO anon,authenticated USING(status='active');

CREATE POLICY "hb_read_active_imprints" ON public.publishing_imprints FOR SELECT TO anon,authenticated USING(is_active AND EXISTS(SELECT 1 FROM public.publishing_houses ph WHERE ph.id=publishing_house_id AND ph.status='active'));

CREATE POLICY "hb_read_active_promotions" ON public.promotion_campaigns FOR SELECT TO anon,authenticated USING(is_active AND (starts_at IS NULL OR starts_at<=now()) AND (ends_at IS NULL OR ends_at>=now()));

CREATE POLICY "hb_author_book_distribution" ON public.book_distribution_settings FOR ALL TO authenticated USING(EXISTS(SELECT 1 FROM public.books b WHERE b.id=book_id AND b.author_id=(SELECT auth.uid()))) WITH CHECK(EXISTS(SELECT 1 FROM public.books b WHERE b.id=book_id AND b.author_id=(SELECT auth.uid())));

CREATE POLICY "hb_author_read_own" ON public.author_royalty_accounts FOR SELECT TO authenticated USING(user_id=(SELECT auth.uid()));

CREATE POLICY "hb_author_read_own" ON public.author_royalty_transactions FOR SELECT TO authenticated USING(user_id=(SELECT auth.uid()));

CREATE POLICY "hb_author_read_own" ON public.author_payout_accounts FOR SELECT TO authenticated USING(user_id=(SELECT auth.uid()));

CREATE POLICY "hb_author_read_own" ON public.author_payouts FOR SELECT TO authenticated USING(user_id=(SELECT auth.uid()));

CREATE POLICY "hb_author_update_payout_account" ON public.author_payout_accounts FOR ALL TO authenticated USING(user_id=(SELECT auth.uid())) WITH CHECK(user_id=(SELECT auth.uid()) AND is_verified=false);

CREATE POLICY "hb_author_read_manuscripts" ON public.book_manuscript_versions FOR SELECT TO authenticated USING(EXISTS(SELECT 1 FROM public.books b WHERE b.id=book_id AND b.author_id=(SELECT auth.uid())));

CREATE POLICY "hb_author_read_cases" ON public.publishing_review_cases FOR SELECT TO authenticated USING(author_id=(SELECT auth.uid()));

CREATE INDEX IF NOT EXISTS hb_books_publisher_idx ON public.books(publishing_house_id, status);

CREATE INDEX IF NOT EXISTS hb_media_book_idx ON public.media_editions(book_id,status);

CREATE INDEX IF NOT EXISTS hb_royalties_user_idx ON public.author_royalty_transactions(user_id,earned_at DESC);

CREATE INDEX IF NOT EXISTS hb_market_book_idx ON public.book_market_prices(book_id,country_code,is_active);

CREATE INDEX IF NOT EXISTS hb_ad_placement_code_idx ON public.ad_placements(code);

COMMIT;