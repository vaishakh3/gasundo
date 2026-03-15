import 'server-only'

import { requireSupabaseAdmin } from './supabase-admin.js'
export {
  ANALYTICS_DEFAULT_LIMIT,
  ANALYTICS_MAX_LIMIT,
  ANALYTICS_METRICS,
  aggregateRestaurantCounters,
  getTodayAnalyticsDate,
  isAnalyticsMetric,
  normalizeAnalyticsDate,
  normalizeAnalyticsLimit,
  validateAnalyticsDateRange,
  validateAnalyticsMetric,
  validatePlaceOpenPayload,
} from './analytics-core.js'
import {
  ANALYTICS_DEFAULT_LIMIT,
  aggregateRestaurantCounters,
  normalizeAnalyticsLimit,
  validateAnalyticsDateRange,
  validateAnalyticsMetric,
} from './analytics-core.js'

export async function incrementAnalyticsCounter({
  metric,
  restaurantKey = null,
  restaurantName = null,
}) {
  const metricValidation = validateAnalyticsMetric(metric)

  if (metricValidation.error) {
    throw new Error(metricValidation.error)
  }

  const supabase = requireSupabaseAdmin()
  const { error } = await supabase.rpc('increment_analytics_counter', {
    counter_metric: metricValidation.data,
    counter_restaurant_key: restaurantKey,
    counter_restaurant_name: restaurantName,
  })

  if (error) {
    throw error
  }
}

export async function readAnalyticsCounters({
  metric,
  from,
  to,
  limit = ANALYTICS_DEFAULT_LIMIT,
}) {
  const metricValidation = validateAnalyticsMetric(metric)

  if (metricValidation.error) {
    throw new Error(metricValidation.error)
  }

  const dateRangeValidation = validateAnalyticsDateRange(from, to)

  if (dateRangeValidation.error) {
    throw new Error(dateRangeValidation.error)
  }

  const normalizedLimit = normalizeAnalyticsLimit(limit)

  if (!normalizedLimit) {
    throw new Error('Limit must be a positive integer.')
  }

  const supabase = requireSupabaseAdmin()
  const { from: rangeStart, to: rangeEnd } = dateRangeValidation.data

  const [
    { data: totals, error: totalsError },
    { data: restaurantRows, error: restaurantRowsError },
  ] = await Promise.all([
    supabase
      .from('analytics_daily_counters')
      .select('bucket_date, count')
      .eq('metric', metricValidation.data)
      .gte('bucket_date', rangeStart)
      .lte('bucket_date', rangeEnd)
      .order('bucket_date', { ascending: true }),
    supabase
      .from('analytics_restaurant_daily_counters')
      .select('restaurant_key, restaurant_name, count')
      .eq('metric', metricValidation.data)
      .gte('bucket_date', rangeStart)
      .lte('bucket_date', rangeEnd),
  ])

  if (totalsError) {
    throw totalsError
  }

  if (restaurantRowsError) {
    throw restaurantRowsError
  }

  return {
    range: {
      from: rangeStart,
      to: rangeEnd,
    },
    metric: metricValidation.data,
    totals: (totals || []).map((row) => ({
      bucket_date: row.bucket_date,
      count: Number(row.count || 0),
    })),
    top_restaurants: aggregateRestaurantCounters(restaurantRows || [], normalizedLimit),
  }
}
