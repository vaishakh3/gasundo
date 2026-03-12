create or replace function public.build_restaurant_key(
  restaurant_name text,
  lat_value double precision,
  lng_value double precision
)
returns text
language sql
immutable
as $$
  select concat(
    trim(
      both '-'
      from regexp_replace(lower(coalesce(restaurant_name, 'restaurant')), '[^a-z0-9]+', '-', 'g')
    ),
    '::',
    to_char(round(lat_value::numeric, 5), 'FM999990.00000'),
    '::',
    to_char(round(lng_value::numeric, 5), 'FM999990.00000')
  );
$$;

alter table public.restaurant_status
  add column if not exists restaurant_key text;

update public.restaurant_status
set restaurant_key = public.build_restaurant_key(restaurant_name, lat, lng)
where restaurant_key is null;

create index if not exists restaurant_status_restaurant_key_updated_at_idx
  on public.restaurant_status (restaurant_key, updated_at desc, id desc);

create table if not exists public.restaurant_latest_status (
  restaurant_key text primary key,
  status_id bigint unique not null references public.restaurant_status(id) on delete cascade,
  restaurant_name text not null,
  lat double precision not null,
  lng double precision not null,
  status text not null,
  note text,
  confirmations integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create or replace function public.refresh_latest_restaurant_status(
  target_restaurant_key text
)
returns void
language plpgsql
as $$
declare
  latest_row public.restaurant_status%rowtype;
begin
  if target_restaurant_key is null then
    return;
  end if;

  select *
  into latest_row
  from public.restaurant_status
  where restaurant_key = target_restaurant_key
  order by updated_at desc, id desc
  limit 1;

  if latest_row.id is null then
    delete from public.restaurant_latest_status
    where restaurant_key = target_restaurant_key;
    return;
  end if;

  insert into public.restaurant_latest_status (
    restaurant_key,
    status_id,
    restaurant_name,
    lat,
    lng,
    status,
    note,
    confirmations,
    created_at,
    updated_at
  )
  values (
    latest_row.restaurant_key,
    latest_row.id,
    latest_row.restaurant_name,
    latest_row.lat,
    latest_row.lng,
    latest_row.status,
    latest_row.note,
    coalesce(latest_row.confirmations, 0),
    coalesce(latest_row.created_at, timezone('utc', now())),
    coalesce(latest_row.updated_at, timezone('utc', now()))
  )
  on conflict (restaurant_key) do update
  set status_id = excluded.status_id,
      restaurant_name = excluded.restaurant_name,
      lat = excluded.lat,
      lng = excluded.lng,
      status = excluded.status,
      note = excluded.note,
      confirmations = excluded.confirmations,
      created_at = excluded.created_at,
      updated_at = excluded.updated_at;
end;
$$;

insert into public.restaurant_latest_status (
  restaurant_key,
  status_id,
  restaurant_name,
  lat,
  lng,
  status,
  note,
  confirmations,
  created_at,
  updated_at
)
select distinct on (restaurant_key)
  restaurant_key,
  id,
  restaurant_name,
  lat,
  lng,
  status,
  note,
  coalesce(confirmations, 0),
  coalesce(created_at, timezone('utc', now())),
  coalesce(updated_at, timezone('utc', now()))
from public.restaurant_status
where restaurant_key is not null
order by restaurant_key, updated_at desc, id desc
on conflict (restaurant_key) do update
set status_id = excluded.status_id,
    restaurant_name = excluded.restaurant_name,
    lat = excluded.lat,
    lng = excluded.lng,
    status = excluded.status,
    note = excluded.note,
    confirmations = excluded.confirmations,
    created_at = excluded.created_at,
    updated_at = excluded.updated_at;

create or replace function public.sync_restaurant_latest_status()
returns trigger
language plpgsql
as $$
begin
  perform public.refresh_latest_restaurant_status(
    coalesce(new.restaurant_key, old.restaurant_key)
  );

  return coalesce(new, old);
end;
$$;

drop trigger if exists restaurant_status_sync_latest_status
on public.restaurant_status;

create trigger restaurant_status_sync_latest_status
after insert or update of restaurant_key, status, note, confirmations, updated_at
on public.restaurant_status
for each row
execute function public.sync_restaurant_latest_status();

create or replace function public.increment_confirmations(status_id bigint)
returns setof public.restaurant_status
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_row public.restaurant_status%rowtype;
begin
  update public.restaurant_status
  set confirmations = coalesce(confirmations, 0) + 1,
      updated_at = timezone('utc', now())
  where id = status_id
  returning *
  into updated_row;

  if updated_row.id is null then
    return;
  end if;

  perform public.refresh_latest_restaurant_status(updated_row.restaurant_key);

  return query
  select *
  from public.restaurant_status
  where id = updated_row.id;
end;
$$;
