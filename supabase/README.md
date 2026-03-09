# Supabase setup

Create a `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Apply SQL migrations in order from Supabase SQL editor:
- `supabase/migrations/0001_initial.sql`
- `supabase/migrations/0002_books_metadata_and_formats.sql`
- `supabase/migrations/0003_profiles_self_insert_and_backfill.sql`
- `supabase/migrations/0004_sync_author_role_from_auth_metadata.sql`
- `supabase/migrations/0005_fix_profiles_policy_recursion.sql`
- `supabase/migrations/0006_allow_public_read_book_covers.sql`

Create storage bucket:
- Bucket name: `books`
- Public bucket: `false`

Recommended folders:
- `books/covers`
- `books/files`
