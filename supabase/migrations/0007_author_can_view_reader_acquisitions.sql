create policy "Author can view own book library rows"
on public.library
for select
using (
  exists (
    select 1
    from public.books b
    where b.id = book_id
      and b.author_id = auth.uid()
  )
);

create policy "Author can view own book orders"
on public.orders
for select
using (
  exists (
    select 1
    from public.order_items oi
    join public.books b on b.id = oi.book_id
    where oi.order_id = id
      and b.author_id = auth.uid()
  )
);

create policy "Author can view readers of own books"
on public.profiles
for select
using (
  exists (
    select 1
    from public.library l
    join public.books b on b.id = l.book_id
    where l.user_id = profiles.id
      and b.author_id = auth.uid()
  )
  or exists (
    select 1
    from public.orders o
    join public.order_items oi on oi.order_id = o.id
    join public.books b on b.id = oi.book_id
    where o.user_id = profiles.id
      and b.author_id = auth.uid()
  )
);
