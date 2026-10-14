/**
 * Colonnes lisibles via PostgREST (anon et authenticated).
 * La migration de sécurité masque les autres colonnes (droits de colonne) :
 * un `select("*")` sur ces tables échouerait avec « permission denied ».
 * Les colonnes privées se lisent par RPC : hb_book_private_fields, hb_book_format_files,
 * hb_author_profile_private.
 */
export const BOOK_PUBLIC_COLUMNS = [
  "id", "title", "description", "price", "author_id", "cover_url", "status", "created_at", "subtitle",
  "co_authors", "isbn", "language", "publisher", "publication_date", "page_count", "categories", "tags",
  "age_rating", "edition", "series_name", "series_position", "file_format", "file_size", "sample_url",
  "sample_pages", "cover_thumbnail_url", "cover_alt_text", "updated_at", "published_at", "views_count",
  "purchases_count", "rating_avg", "ratings_count", "currency_code", "is_single_sale_enabled",
  "is_subscription_available", "review_status", "submitted_at", "reviewed_at", "reviewed_by", "review_note",
  "author_display_name", "copyright_status", "copyright_blocked_at", "copyright_blocked_by",
  "admin_import_batch_id", "admin_import_item_id", "admin_imported_by", "admin_imported_at",
  "authorship_type", "author_credit", "editorial_pole", "work_type", "editorial_stage", "spiritual_metadata",
  "cover_source", "bat_status", "bat_approved_at", "bat_approved_by", "publishing_house_id", "imprint_id",
  "reading_access_mode", "can_read_on_platform", "allow_download", "allow_print", "allow_copy",
  "reader_watermark_enabled", "reader_rights_note", "writing_status", "target_word_count",
  "current_word_count", "next_author_action", "editorial_deadline", "clicks_count",
].join(",");

export const AUTHOR_PROFILE_PUBLIC_COLUMNS = [
  "id", "display_name", "avatar_url", "bio", "website", "location", "social_links", "created_at", "updated_at",
  "professional_headline", "genres", "publishing_goals", "favorite_book", "favorite_author",
  "favorite_character", "press_mentions", "country_code", "catalog_origin", "is_reference_profile",
].join(",");

/** Code PostgREST d'une fonction absente (migration de sécurité pas encore appliquée). */
export const PGRST_FUNCTION_NOT_FOUND = "PGRST202";
