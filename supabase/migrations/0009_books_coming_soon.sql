do $$
begin
  if exists (
    select 1 from pg_constraint
    where conname = 'books_status_check'
      and conrelid = 'public.books'::regclass
  ) then
    alter table public.books drop constraint books_status_check;
  end if;

  alter table public.books
    add constraint books_status_check
    check (status in ('draft', 'published', 'archived', 'coming_soon'));
end $$;

drop policy if exists "Anyone can view published books" on public.books;

create policy "Anyone can view published or coming soon books"
on public.books
for select
using (status in ('published', 'coming_soon'));
