import { parseDistrictSlug } from './districts.js'

export const ANALYTICS_METRICS = [
  'place_open',
  'status_update',
  'status_confirm',
]
export const ANALYTICS_DEFAULT_LIMIT = 20
export const ANALYTICS_MAX_LIMIT = 100

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/

export function isAnalyticsMetric(value) {
  return ANALYTICS_METRICS.includes(value)
}

export function validateAnalyticsMetric(value) {
  const metric = typeof value === 'string' ? value.trim() : ''

  if (!isAnalyticsMetric(metric)) {
    return { error: 'A valid analytics metric is required.' }
  }

  return { data: metric }
}

export function normalizeAnalyticsDate(value) {
  const dateValue = typeof value === 'string' ? value.trim() : ''

  if (!DATE_ONLY_PATTERN.test(dateValue)) {
    return null
  }

  const parsedDate = new Date(`${dateValue}T00:00:00.000Z`)

  if (Number.isNaN(parsedDate.valueOf())) {
    return null
  }

  return parsedDate.toISOString().slice(0, 10) === dateValue ? dateValue : null
}

export function getTodayAnalyticsDate() {
  return new Date().toISOString().slice(0, 10)
}

export function validateAnalyticsDateRange(fromValue, toValue) {
  const fallbackDate = getTodayAnalyticsDate()
  const from = fromValue == null ? fallbackDate : normalizeAnalyticsDate(fromValue)
  const to = toValue == null ? fallbackDate : normalizeAnalyticsDate(toValue)

  if (!from) {
    return { error: 'The from date must be a valid YYYY-MM-DD value.' }
  }

  if (!to) {
    return { error: 'The to date must be a valid YYYY-MM-DD value.' }
  }

  if (from > to) {
    return { error: 'The from date must be earlier than or equal to the to date.' }
  }

  return {
    data: {
      from,
      to,
    },
  }
}

export function normalizeAnalyticsLimit(value) {
  if (value == null) {
    return ANALYTICS_DEFAULT_LIMIT
  }

  const parsedLimit = Number(value)

  if (!Number.isInteger(parsedLimit) || parsedLimit < 1) {
    return null
  }

  return Math.min(parsedLimit, ANALYTICS_MAX_LIMIT)
}

export function validatePlaceOpenPayload(payload) {
  if (!payload || typeof payload !== 'object') {
    return { error: 'Invalid request body.' }
  }

  const restaurantKey =
    typeof payload.restaurant_key === 'string'
      ? payload.restaurant_key.trim()
      : ''

  if (!restaurantKey) {
    return { error: 'Restaurant key is required.' }
  }

  if (restaurantKey.length > 220) {
    return { error: 'Restaurant key must be 220 characters or fewer.' }
  }

  const restaurantName =
    typeof payload.restaurant_name === 'string'
      ? payload.restaurant_name.trim()
      : ''

  if (!restaurantName) {
    return { error: 'Restaurant name is required.' }
  }

  if (restaurantName.length > 120) {
    return { error: 'Restaurant name must be 120 characters or fewer.' }
  }

  const districtSlugInput =
    typeof payload.district_slug === 'string' ? payload.district_slug : ''
  const districtSlug =
    districtSlugInput.trim() === '' ? null : parseDistrictSlug(districtSlugInput)

  if (districtSlugInput.trim() !== '' && !districtSlug) {
    return { error: 'District must be a supported Kerala district.' }
  }

  return {
    data: {
      restaurant_key: restaurantKey,
      restaurant_name: restaurantName,
      district_slug: districtSlug,
    },
  }
}

export function aggregateRestaurantCounters(rows = [], limit = ANALYTICS_DEFAULT_LIMIT) {
  const countersByRestaurantKey = new Map()

  for (const row of rows) {
    const restaurantKey =
      typeof row?.restaurant_key === 'string' ? row.restaurant_key : ''

    if (!restaurantKey) {
      continue
    }

    const restaurantName =
      typeof row?.restaurant_name === 'string' && row.restaurant_name.trim()
        ? row.restaurant_name.trim()
        : restaurantKey
    const count = Number(row?.count || 0)

    if (!Number.isFinite(count) || count <= 0) {
      continue
    }

    const currentCounter = countersByRestaurantKey.get(restaurantKey)

    if (currentCounter) {
      currentCounter.count += count
      currentCounter.restaurant_name = restaurantName
      continue
    }

    countersByRestaurantKey.set(restaurantKey, {
      restaurant_key: restaurantKey,
      restaurant_name: restaurantName,
      count,
    })
  }

  return [...countersByRestaurantKey.values()]
    .sort((left, right) => {
      if (right.count !== left.count) {
        return right.count - left.count
      }

      return left.restaurant_name.localeCompare(right.restaurant_name)
    })
    .slice(0, limit)
}
