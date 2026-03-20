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
- `proxy.ts` protects dashboard + secure reader API access.
- `lib/auth.ts` has role-based helpers.
- `supabase/migrations/0001_initial.sql` defines schema + RLS + storage policies.

## Reader protection model
- Ebook files are stored in private `books` bucket.
- `/api/read/[bookId]` checks authenticated user + purchase (`library` table).
- API returns short-lived signed URL and file type.
- `ReaderPopup` renders epub/pdf in modal with no direct download button.

## Setup
1. Create `.env.local` from `.env.example`.
2. Fill at least these variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_APP_URL=https://your-domain.com`
   - `APP_BASE_URL=https://your-domain.com`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `SUPABASE_DB_WEBHOOK_SECRET=long-random-secret`
   - `EASYPAY_PUBLISHABLE_KEY`
   - `EASYPAY_CORRELATION_ID`
   - `EASYPAY_MODE=sandbox`
   - `EASYPAY_BASE_URL=https://www.e-com-easypay.com`
   - `SMTP_HOST`
   - `SMTP_PORT`
   - `SMTP_USER`
   - `SMTP_PASS`
   - `SMTP_FROM`
   - `CONTACT_TO`
   - `ADMIN_NOTIFY_EMAIL=your-admin@email.com`
   - Optional: `NEXT_PUBLIC_ANDROID_APK_URL`
3. Important: checkout and some admin/payment flows create or update data from the server, so `SUPABASE_SERVICE_ROLE_KEY` must stay server-side only.
4. `.env.local` is ignored by git on purpose. Commit `.env.example`, never your real secrets.
5. Apply SQL migrations in Supabase, including the latest content migrations `supabase/migrations/0016_blog_posts.sql` and `supabase/migrations/0017_flash_sale_configs.sql`.
6. Run `npm run dev`.

## Vercel notes
- Add all variables from `.env.local` to Vercel Project Settings -> Environment Variables.
- Keep `SUPABASE_SERVICE_ROLE_KEY` only on the server side, never in public client code.
- The admin blog and flash sale settings now target Supabase storage instead of local file writes, which avoids Vercel filesystem write failures.
- If you use blog cover images, prefer stable public URLs or Supabase public storage URLs.

## New User Admin Notification
- Route available: `/api/webhooks/supabase/new-user`
- Expected use: configure a Supabase Database Webhook on `public.profiles`
- Event: `INSERT`
- URL: `https://your-domain.com/api/webhooks/supabase/new-user`
- Custom header: `x-webhook-secret: <SUPABASE_DB_WEBHOOK_SECRET>`
- The route sends an admin email using the existing SMTP configuration.

## Supabase Auth Redirects
- Email confirmation callback route: `/auth/callback`
- Signup uses `emailRedirectTo=<NEXT_PUBLIC_APP_URL>/auth/callback?next=/dashboard`
- In Supabase Dashboard, set:
- `Authentication -> URL Configuration -> Site URL = https://your-domain.com`
- `Authentication -> URL Configuration -> Redirect URLs` should include:
- `https://your-domain.com/auth/callback`

## Next implementation steps
1. Extend checkout to multi-book cart and pending-order reuse strategy.
2. Add admin moderation actions (publish/remove).
3. Add richer reader controls (bookmark/progress).
