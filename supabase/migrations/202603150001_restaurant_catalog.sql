create table if not exists public.restaurant_catalog (
  place_id text primary key,
  restaurant_key text not null unique,
  name text not null,
  brand text,
  address text,
  lat double precision not null,
  lng double precision not null,
  primary_type text,
  business_status text,
  source text not null default 'google-places',
  first_seen_at timestamptz not null default timezone('utc', now()),
  last_seen_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists restaurant_catalog_name_idx
  on public.restaurant_catalog (name);

create index if not exists restaurant_catalog_restaurant_key_idx
  on public.restaurant_catalog (restaurant_key);

create index if not exists restaurant_catalog_last_seen_at_idx
  on public.restaurant_catalog (last_seen_at desc);

create table if not exists public.restaurant_catalog_sync (
  id text primary key,
  status text not null default 'idle',
  last_started_at timestamptz,
  last_completed_at timestamptz,
  last_successful_at timestamptz,
  restaurant_count integer not null default 0,
  last_error text,
  updated_at timestamptz not null default timezone('utc', now())
);

insert into public.restaurant_catalog_sync (id, status, restaurant_count)
values ('main', 'idle', 0)
on conflict (id) do nothing;

select pg_notify('pgrst', 'reload schema');
