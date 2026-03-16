# Supabase setup

Create a `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_APP_URL=https://your-domain.com
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
CINETPAY_API_KEY=your-cinetpay-api-key
CINETPAY_SITE_ID=your-cinetpay-site-id
CINETPAY_BASE_URL=https://api-checkout.cinetpay.com/v2
APP_BASE_URL=https://your-domain.com
ADMIN_NOTIFY_EMAIL=your-admin@email.com
SUPABASE_DB_WEBHOOK_SECRET=long-random-secret
```

`SUPABASE_SERVICE_ROLE_KEY` is required for server-side checkout flows such as Mobile Money / CinetPay because orders and library access are written from secure API routes.

Apply all SQL migrations in order from the `supabase/migrations` folder, including the latest payment tracking migration:
- `supabase/migrations/0014_cinetpay_checkout_orders.sql`

To notify the admin on each new signup, configure a Supabase Database Webhook:
- Table: `public.profiles`
- Event: `INSERT`
- URL: `https://your-domain.com/api/webhooks/supabase/new-user`
- Header: `x-webhook-secret: <SUPABASE_DB_WEBHOOK_SECRET>`

Configure Supabase Auth URL settings:
- `Site URL`: `https://your-domain.com`
- Add redirect URL: `https://your-domain.com/auth/callback`

Create storage bucket:
- Bucket name: `books`
- Public bucket: `false`

Recommended folders:
- `books/covers`
- `books/files`
