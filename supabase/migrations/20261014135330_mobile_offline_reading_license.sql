-- Issues a short-lived offline reader licence after checking the caller's
-- entitlement. The raw token is returned once; only its SHA-256 hash is stored.
create or replace function public.issue_mobile_offline_license(
  p_device_uuid text,
  p_book_id uuid,
  p_platform text default 'android',
  p_app_version_name text default null,
  p_app_version_code integer default null
)
returns table (
  license_id uuid,
  download_id uuid,
  device_id uuid,
  license_token text,
  valid_until timestamptz,
  max_offline_days smallint
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_device public.user_devices%rowtype;
  v_license_id uuid;
  v_download_id uuid;
  v_raw_token text;
  v_days smallint := 7;
  v_valid_until timestamptz;
begin
  if v_user_id is null then
    raise exception using errcode = '42501', message = 'Authentification requise.';
  end if;

  p_device_uuid := trim(coalesce(p_device_uuid, ''));
  p_platform := lower(trim(coalesce(p_platform, '')));
  if length(p_device_uuid) < 16 or length(p_device_uuid) > 128 then
    raise exception using errcode = '22023', message = 'Identifiant appareil invalide.';
  end if;
  if p_platform not in ('android', 'ios') then
    raise exception using errcode = '22023', message = 'Plateforme mobile invalide.';
  end if;
  if p_app_version_code is not null and p_app_version_code < 1 then
    raise exception using errcode = '22023', message = 'Version application invalide.';
  end if;

  if not exists (
    select 1
    from public.books b
    where b.id = p_book_id
      and b.status = 'published'
      and b.copyright_status <> 'blocked'
      and b.can_read_on_platform
  ) then
    raise exception using errcode = '42501', message = 'Livre indisponible pour la lecture protégée.';
  end if;

  if not public.user_has_access_to_book(v_user_id, p_book_id) then
    raise exception using errcode = '42501', message = 'Accès à ce livre refusé.';
  end if;

  select * into v_device
  from public.user_devices d
  where d.user_id = v_user_id and d.device_uuid = p_device_uuid;

  if found and (
    not v_device.is_active
    or v_device.revoked_at is not null
    or v_device.integrity_status in ('suspicious', 'blocked')
  ) then
    raise exception using errcode = '42501', message = 'Cet appareil ne peut pas recevoir de licence hors ligne.';
  end if;

  if found then
    update public.user_devices
    set platform = p_platform,
        app_version_name = left(nullif(trim(p_app_version_name), ''), 50),
        app_version_code = p_app_version_code,
        last_seen_at = now(),
        updated_at = now()
    where id = v_device.id
    returning * into v_device;
  else
    insert into public.user_devices (
      user_id, device_uuid, platform, app_version_name, app_version_code,
      integrity_status, is_active, metadata
    ) values (
      v_user_id, p_device_uuid, p_platform,
      left(nullif(trim(p_app_version_name), ''), 50), p_app_version_code,
      'unknown', true, jsonb_build_object('source', 'flutter_offline_reader')
    ) returning * into v_device;
  end if;

  if exists (
    select 1 from public.library l
    where l.user_id = v_user_id
      and l.book_id = p_book_id
      and l.status = 'active'
      and l.access_type in ('purchase', 'free')
      and (l.expires_at is null or l.expires_at > now())
  ) then
    v_days := 30;
  end if;
  v_valid_until := now() + make_interval(days => v_days);

  update public.offline_reading_licenses
  set status = 'expired',
      revoked_at = now(),
      revoke_reason = 'renewed',
      updated_at = now()
  where user_id = v_user_id
    and device_id = v_device.id
    and book_id = p_book_id
    and status = 'active';

  v_raw_token := encode(extensions.gen_random_bytes(32), 'hex');
  insert into public.offline_reading_licenses (
    user_id, device_id, book_id, license_token_hash, status,
    issued_at, valid_until, max_offline_days, last_verified_at, metadata
  ) values (
    v_user_id, v_device.id, p_book_id,
    encode(extensions.digest(v_raw_token, 'sha256'), 'hex'), 'active',
    now(), v_valid_until, v_days, now(),
    jsonb_build_object('delivery', 'encrypted_page_cache', 'source', 'flutter')
  ) returning id into v_license_id;

  insert into public.book_downloads (
    user_id, device_id, book_id, license_id, status, started_at, metadata
  ) values (
    v_user_id, v_device.id, p_book_id, v_license_id, 'requested', now(),
    jsonb_build_object('delivery', 'encrypted_page_cache', 'source', 'flutter')
  ) returning id into v_download_id;

  return query select
    v_license_id, v_download_id, v_device.id, v_raw_token,
    v_valid_until, v_days;
end;
$$;

revoke all on function public.issue_mobile_offline_license(text, uuid, text, text, integer) from public;
revoke all on function public.issue_mobile_offline_license(text, uuid, text, text, integer) from anon;
grant execute on function public.issue_mobile_offline_license(text, uuid, text, text, integer) to authenticated;

comment on function public.issue_mobile_offline_license(text, uuid, text, text, integer)
is 'Issues a device-bound, time-limited licence for the encrypted Flutter offline reader after entitlement validation.';
