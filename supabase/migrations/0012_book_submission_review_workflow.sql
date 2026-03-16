alter table public.books
  add column if not exists review_status text not null default 'draft',
  add column if not exists submitted_at timestamptz,
  add column if not exists reviewed_at timestamptz,
  add column if not exists reviewed_by uuid references public.profiles(id) on delete set null,
  add column if not exists review_note text;

do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conname = 'books_review_status_check'
      and conrelid = 'public.books'::regclass
  ) then
    alter table public.books drop constraint books_review_status_check;
  end if;

  alter table public.books
    add constraint books_review_status_check
    check (review_status in ('draft', 'submitted', 'approved', 'rejected', 'changes_requested'));
end $$;

update public.books
set review_status = case
  when status in ('published', 'coming_soon', 'archived') then 'approved'
  else 'draft'
end
where review_status = 'draft';

create index if not exists books_review_status_idx on public.books(review_status);
create index if not exists books_submitted_at_idx on public.books(submitted_at desc);
create index if not exists books_reviewed_by_idx on public.books(reviewed_by);

alter table public.book_formats
  add column if not exists printing_cost numeric(10,2);

do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conname = 'book_formats_printing_cost_check'
      and conrelid = 'public.book_formats'::regclass
  ) then
    alter table public.book_formats drop constraint book_formats_printing_cost_check;
  end if;

  alter table public.book_formats
    add constraint book_formats_printing_cost_check
    check (printing_cost is null or printing_cost >= 0);
end $$;

create or replace function public.enforce_author_book_submission_workflow()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if public.is_current_user_admin() then
    return new;
  end if;

  if auth.uid() is null then
    return new;
  end if;

  if new.author_id <> auth.uid() then
    raise exception 'Only the owning author can manage this book.';
  end if;

  if tg_op = 'UPDATE' then
    if new.reviewed_at is distinct from old.reviewed_at
      or new.reviewed_by is distinct from old.reviewed_by
      or new.review_note is distinct from old.review_note then
      raise exception 'Admin review fields can only be changed by an admin.';
    end if;
  else
    new.reviewed_at := null;
    new.reviewed_by := null;
    new.review_note := null;
  end if;

  if new.review_status not in ('draft', 'submitted') then
    raise exception 'Authors can only save drafts or submit books for review.';
  end if;

  new.status := 'draft';
  new.published_at := null;

  if new.review_status = 'submitted' then
    new.submitted_at := coalesce(new.submitted_at, now());
  else
    new.submitted_at := null;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_books_author_submission_workflow on public.books;
create trigger trg_books_author_submission_workflow
before insert or update on public.books
for each row execute procedure public.enforce_author_book_submission_workflow();

create or replace function public.enforce_author_book_format_workflow()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  owning_author_id uuid;
begin
  if public.is_current_user_admin() then
    return new;
  end if;

  if auth.uid() is null then
    return new;
  end if;

  select b.author_id
  into owning_author_id
  from public.books b
  where b.id = new.book_id;

  if owning_author_id is null or owning_author_id <> auth.uid() then
    raise exception 'Only the owning author can manage this format.';
  end if;

  new.is_published := false;

  if new.format in ('paperback', 'hardcover') then
    new.stock_quantity := null;
    new.downloadable := false;
  else
    new.printing_cost := null;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_book_formats_author_workflow on public.book_formats;
create trigger trg_book_formats_author_workflow
before insert or update on public.book_formats
for each row execute procedure public.enforce_author_book_format_workflow();

create or replace function public.enforce_author_book_format_delete_workflow()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if public.is_current_user_admin() then
    return old;
  end if;

  if auth.uid() is null then
    return old;
  end if;

  if old.format in ('paperback', 'hardcover') and old.is_published = true then
    raise exception 'Published physical formats can only be removed by an admin.';
  end if;

  return old;
end;
$$;

drop trigger if exists trg_book_formats_author_delete_workflow on public.book_formats;
create trigger trg_book_formats_author_delete_workflow
before delete on public.book_formats
for each row execute procedure public.enforce_author_book_format_delete_workflow();

drop policy if exists "Authors can update own books" on public.books;
create policy "Authors can update own books"
on public.books
for update
using (auth.uid() = author_id)
with check (auth.uid() = author_id);

drop policy if exists "Authors can update own formats" on public.book_formats;
create policy "Authors can update own formats"
on public.book_formats
for update
using (
  exists (
    select 1
    from public.books b
    where b.id = book_id
      and b.author_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.books b
    where b.id = book_id
      and b.author_id = auth.uid()
  )
);
