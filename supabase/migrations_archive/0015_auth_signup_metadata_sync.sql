create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  safe_role text;
  first_name_value text;
  last_name_value text;
  fallback_name text;
  full_name text;
  favorite_categories_value text[] := '{}'::text[];
  marketing_opt_in_value boolean := false;
  author_profile_payload jsonb := '{}'::jsonb;
  author_genres_value text[] := '{}'::text[];
begin
  safe_role := case
    when coalesce(new.raw_user_meta_data->>'role', 'reader') = 'author' then 'author'
    else 'reader'
  end;

  first_name_value := nullif(coalesce(new.raw_user_meta_data->>'first_name', ''), '');
  last_name_value := nullif(coalesce(new.raw_user_meta_data->>'last_name', ''), '');
  fallback_name := nullif(coalesce(new.raw_user_meta_data->>'name', ''), '');
  full_name := nullif(trim(concat_ws(' ', first_name_value, last_name_value)), '');

  if jsonb_typeof(new.raw_user_meta_data->'favorite_categories') = 'array' then
    favorite_categories_value := array(
      select jsonb_array_elements_text(new.raw_user_meta_data->'favorite_categories')
    );
  end if;

  marketing_opt_in_value := coalesce((new.raw_user_meta_data->>'marketing_opt_in')::boolean, false);
  author_profile_payload := coalesce(new.raw_user_meta_data->'author_profile', '{}'::jsonb);

  if jsonb_typeof(author_profile_payload->'genres') = 'array' then
    author_genres_value := array(
      select jsonb_array_elements_text(author_profile_payload->'genres')
    );
  end if;

  insert into public.profiles (
    id,
    email,
    name,
    role,
    first_name,
    last_name,
    phone,
    country,
    city,
    preferred_language,
    favorite_categories,
    marketing_opt_in
  )
  values (
    new.id,
    new.email,
    coalesce(full_name, fallback_name),
    safe_role,
    first_name_value,
    last_name_value,
    nullif(coalesce(new.raw_user_meta_data->>'phone', ''), ''),
    nullif(coalesce(new.raw_user_meta_data->>'country', ''), ''),
    nullif(coalesce(new.raw_user_meta_data->>'city', ''), ''),
    coalesce(nullif(coalesce(new.raw_user_meta_data->>'preferred_language', ''), ''), 'fr'),
    favorite_categories_value,
    marketing_opt_in_value
  )
  on conflict (id) do update set
    email = excluded.email,
    name = excluded.name,
    role = excluded.role,
    first_name = excluded.first_name,
    last_name = excluded.last_name,
    phone = excluded.phone,
    country = excluded.country,
    city = excluded.city,
    preferred_language = excluded.preferred_language,
    favorite_categories = excluded.favorite_categories,
    marketing_opt_in = excluded.marketing_opt_in;

  if safe_role = 'author' then
    insert into public.author_profiles (
      id,
      display_name,
      bio,
      website,
      location,
      professional_headline,
      phone,
      genres,
      publishing_goals,
      social_links
    )
    values (
      new.id,
      coalesce(
        nullif(coalesce(author_profile_payload->>'display_name', ''), ''),
        coalesce(full_name, fallback_name, 'Auteur')
      ),
      nullif(coalesce(author_profile_payload->>'bio', ''), ''),
      nullif(coalesce(author_profile_payload->>'website', ''), ''),
      nullif(
        coalesce(
          author_profile_payload->>'location',
          trim(concat_ws(', ', nullif(coalesce(new.raw_user_meta_data->>'city', ''), ''), nullif(coalesce(new.raw_user_meta_data->>'country', ''), '')))
        ),
        ''
      ),
      nullif(coalesce(author_profile_payload->>'professional_headline', ''), ''),
      nullif(coalesce(author_profile_payload->>'phone', new.raw_user_meta_data->>'phone', ''), ''),
      author_genres_value,
      nullif(coalesce(author_profile_payload->>'publishing_goals', ''), ''),
      case
        when jsonb_typeof(author_profile_payload->'social_links') = 'object' then author_profile_payload->'social_links'
        else '{}'::jsonb
      end
    )
    on conflict (id) do update set
      display_name = excluded.display_name,
      bio = excluded.bio,
      website = excluded.website,
      location = excluded.location,
      professional_headline = excluded.professional_headline,
      phone = excluded.phone,
      genres = excluded.genres,
      publishing_goals = excluded.publishing_goals,
      social_links = excluded.social_links,
      updated_at = now();
  end if;

  return new;
end;
$$;

update public.profiles p
set
  first_name = coalesce(p.first_name, nullif(coalesce(u.raw_user_meta_data->>'first_name', ''), '')),
  last_name = coalesce(p.last_name, nullif(coalesce(u.raw_user_meta_data->>'last_name', ''), '')),
  phone = coalesce(p.phone, nullif(coalesce(u.raw_user_meta_data->>'phone', ''), '')),
  country = coalesce(p.country, nullif(coalesce(u.raw_user_meta_data->>'country', ''), '')),
  city = coalesce(p.city, nullif(coalesce(u.raw_user_meta_data->>'city', ''), '')),
  preferred_language = case
    when p.preferred_language is null or p.preferred_language = '' then coalesce(nullif(coalesce(u.raw_user_meta_data->>'preferred_language', ''), ''), 'fr')
    else p.preferred_language
  end
from auth.users u
where p.id = u.id;
