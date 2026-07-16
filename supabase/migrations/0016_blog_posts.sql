create table if not exists public.blog_posts (
  id uuid primary key default uuid_generate_v4(),
  slug text not null unique,
  title text not null,
  excerpt text not null,
  tag text not null,
  author text not null,
  read_time text not null,
  cover_label text not null default 'Magazine editorial',
  cover_image_url text,
  cover_image_alt text,
  published_at date not null default current_date,
  content_blocks jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint blog_posts_content_blocks_is_array check (jsonb_typeof(content_blocks) = 'array')
);

create index if not exists blog_posts_published_at_idx on public.blog_posts (published_at desc, created_at desc);

alter table public.blog_posts enable row level security;

drop policy if exists "Anyone can view blog posts" on public.blog_posts;
create policy "Anyone can view blog posts"
on public.blog_posts
for select
using (true);

drop policy if exists "Admin full blog posts access" on public.blog_posts;
create policy "Admin full blog posts access"
on public.blog_posts
for all
using (public.is_current_user_admin())
with check (public.is_current_user_admin());
