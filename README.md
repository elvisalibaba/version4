# HolisticBooks - initial architecture

## Stack
- Next.js (App Router)
- React
- TailwindCSS
- Supabase (PostgreSQL/Auth/Storage)

## Routes
- `/home`
- `/books`
- `/book/[id]`
- `/login`
- `/register`
- `/dashboard`
- `/dashboard/reader`
- `/dashboard/reader/library`
- `/dashboard/reader/purchases`
- `/dashboard/author`
- `/dashboard/author/add-book`
- `/dashboard/author/books`
- `/dashboard/author/sales`
- `/dashboard/admin`
- `/dashboard/admin/users`
- `/dashboard/admin/books`
- `/dashboard/admin/orders`
- `/api/read/[bookId]`

## Core architecture
- Shared Supabase backend supports web now and Flutter later.
- `lib/supabase/client.ts` for browser auth/storage.
- `lib/supabase/server.ts` for server-side auth and queries.
- `middleware.ts` protects dashboard + secure reader API access.
- `lib/auth.ts` has role-based helpers.
- `supabase/migrations/0001_initial.sql` defines schema + RLS + storage policies.

## Reader protection model
- Ebook files are stored in private `books` bucket.
- `/api/read/[bookId]` checks authenticated user + purchase (`library` table).
- API returns short-lived signed URL and file type.
- `ReaderPopup` renders epub/pdf in modal with no direct download button.

## Setup
1. Create `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
2. Apply SQL migration in Supabase.
3. Run `npm run dev`.

## Next implementation steps
1. Add cart and checkout flow that writes `orders`, `order_items`, `library`.
2. Add admin moderation actions (publish/remove).
3. Add richer reader controls (bookmark/progress).
