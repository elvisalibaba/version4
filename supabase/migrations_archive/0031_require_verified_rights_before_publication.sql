-- A book must be explicitly cleared before it can be made public.
-- Existing rows are preserved; public application queries also enforce this rule.
alter table public.books
  alter column copyright_status set default 'review';

create or replace function public.enforce_book_publication_rights()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.status in ('published', 'coming_soon') and new.copyright_status <> 'clear' then
    raise exception 'Publication refusée : les droits de diffusion doivent être validés.'
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

drop trigger if exists enforce_book_publication_rights_trigger on public.books;
create trigger enforce_book_publication_rights_trigger
before insert or update of status, copyright_status on public.books
for each row execute function public.enforce_book_publication_rights();

comment on function public.enforce_book_publication_rights() is
  'Empêche la publication ou la prépublication sans validation explicite des droits.';
