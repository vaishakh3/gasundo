create table if not exists public.analytics_daily_counters (
  bucket_date date not null,
  metric text not null,
  count bigint not null default 0,
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (bucket_date, metric),
  constraint analytics_daily_counters_metric_check
    check (metric in ('place_open', 'status_update', 'status_confirm')),
  constraint analytics_daily_counters_count_check
    check (count >= 0)
);

create table if not exists public.analytics_restaurant_daily_counters (
  bucket_date date not null,
  metric text not null,
  restaurant_key text not null,
  restaurant_name text not null,
  count bigint not null default 0,
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (bucket_date, metric, restaurant_key),
  constraint analytics_restaurant_daily_counters_metric_check
    check (metric in ('place_open', 'status_update', 'status_confirm')),
  constraint analytics_restaurant_daily_counters_count_check
    check (count >= 0)
);

create index if not exists analytics_daily_counters_metric_bucket_date_idx
  on public.analytics_daily_counters (metric, bucket_date desc);

create index if not exists analytics_restaurant_daily_counters_metric_bucket_date_idx
  on public.analytics_restaurant_daily_counters (metric, bucket_date desc, restaurant_key);

alter table public.analytics_daily_counters enable row level security;
alter table public.analytics_restaurant_daily_counters enable row level security;

create or replace function public.increment_analytics_counter(
  counter_metric text,
  counter_restaurant_key text default null,
  counter_restaurant_name text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  current_bucket_date date := timezone('utc', now())::date;
  normalized_metric text := nullif(btrim(counter_metric), '');
  normalized_restaurant_key text := nullif(btrim(counter_restaurant_key), '');
  normalized_restaurant_name text := nullif(btrim(counter_restaurant_name), '');
begin
  if normalized_metric not in ('place_open', 'status_update', 'status_confirm') then
    raise exception 'Unsupported analytics metric.';
  end if;

  insert into public.analytics_daily_counters (
    bucket_date,
    metric,
    count,
    updated_at
  )
  values (
    current_bucket_date,
    normalized_metric,
    1,
    timezone('utc', now())
  )
  on conflict (bucket_date, metric) do update
  set count = public.analytics_daily_counters.count + 1,
      updated_at = timezone('utc', now());

  if normalized_restaurant_key is null then
    return;
  end if;

  if normalized_restaurant_name is null then
    raise exception 'Restaurant name is required when restaurant key is provided.';
  end if;

  insert into public.analytics_restaurant_daily_counters (
    bucket_date,
    metric,
    restaurant_key,
    restaurant_name,
    count,
    updated_at
  )
  values (
    current_bucket_date,
    normalized_metric,
    normalized_restaurant_key,
    normalized_restaurant_name,
    1,
    timezone('utc', now())
  )
  on conflict (bucket_date, metric, restaurant_key) do update
  set restaurant_name = excluded.restaurant_name,
      count = public.analytics_restaurant_daily_counters.count + 1,
      updated_at = timezone('utc', now());
end;
$$;

revoke all on function public.increment_analytics_counter(text, text, text)
from public, anon, authenticated;

grant execute on function public.increment_analytics_counter(text, text, text)
to service_role;

select pg_notify('pgrst', 'reload schema');
