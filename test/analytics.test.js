import assert from 'node:assert/strict'
import test from 'node:test'

import {
  ANALYTICS_DEFAULT_LIMIT,
  ANALYTICS_MAX_LIMIT,
  aggregateRestaurantCounters,
  getTodayAnalyticsDate,
  normalizeAnalyticsDate,
  normalizeAnalyticsLimit,
  validateAnalyticsDateRange,
  validateAnalyticsMetric,
  validatePlaceOpenPayload,
} from '../src/lib/analytics-core.js'

test('validateAnalyticsMetric accepts supported metrics', () => {
  assert.deepEqual(validateAnalyticsMetric('place_open'), {
    data: 'place_open',
  })
  assert.deepEqual(validateAnalyticsMetric('status_update'), {
    data: 'status_update',
  })
  assert.deepEqual(validateAnalyticsMetric('status_confirm'), {
    data: 'status_confirm',
  })
})

test('validateAnalyticsMetric rejects unsupported metrics', () => {
  assert.equal(
    validateAnalyticsMetric('search').error,
    'A valid analytics metric is required.'
  )
})

test('normalizeAnalyticsDate accepts valid YYYY-MM-DD values', () => {
  assert.equal(normalizeAnalyticsDate('2026-03-15'), '2026-03-15')
  assert.equal(normalizeAnalyticsDate('2026-02-30'), null)
  assert.equal(normalizeAnalyticsDate('15-03-2026'), null)
})

test('validateAnalyticsDateRange defaults to today and rejects reversed ranges', () => {
  const today = getTodayAnalyticsDate()

  assert.deepEqual(validateAnalyticsDateRange(null, null), {
    data: {
      from: today,
      to: today,
    },
  })
  assert.equal(
    validateAnalyticsDateRange('2026-03-16', '2026-03-15').error,
    'The from date must be earlier than or equal to the to date.'
  )
})

test('normalizeAnalyticsLimit uses defaults and caps oversized values', () => {
  assert.equal(normalizeAnalyticsLimit(null), ANALYTICS_DEFAULT_LIMIT)
  assert.equal(normalizeAnalyticsLimit('10'), 10)
  assert.equal(
    normalizeAnalyticsLimit(String(ANALYTICS_MAX_LIMIT + 25)),
    ANALYTICS_MAX_LIMIT
  )
  assert.equal(normalizeAnalyticsLimit('0'), null)
})

test('validatePlaceOpenPayload enforces required restaurant fields', () => {
  assert.deepEqual(
    validatePlaceOpenPayload({
      restaurant_key: 'alpha-burger::9.90000::76.20000',
      restaurant_name: 'Alpha Burger',
    }),
    {
      data: {
        restaurant_key: 'alpha-burger::9.90000::76.20000',
        restaurant_name: 'Alpha Burger',
      },
    }
  )

  assert.equal(
    validatePlaceOpenPayload({
      restaurant_key: '',
      restaurant_name: 'Alpha Burger',
    }).error,
    'Restaurant key is required.'
  )
  assert.equal(
    validatePlaceOpenPayload({
      restaurant_key: 'alpha-burger::9.90000::76.20000',
      restaurant_name: '',
    }).error,
    'Restaurant name is required.'
  )
})

test('aggregateRestaurantCounters sums rows by restaurant and sorts by count', () => {
  assert.deepEqual(
    aggregateRestaurantCounters(
      [
        {
          restaurant_key: 'alpha-burger::9.90000::76.20000',
          restaurant_name: 'Alpha Burger',
          count: 2,
        },
        {
          restaurant_key: 'zeta-diner::9.91000::76.21000',
          restaurant_name: 'Zeta Diner',
          count: 3,
        },
        {
          restaurant_key: 'alpha-burger::9.90000::76.20000',
          restaurant_name: 'Alpha Burger',
          count: 4,
        },
      ],
      5
    ),
    [
      {
        restaurant_key: 'alpha-burger::9.90000::76.20000',
        restaurant_name: 'Alpha Burger',
        count: 6,
      },
      {
        restaurant_key: 'zeta-diner::9.91000::76.21000',
        restaurant_name: 'Zeta Diner',
        count: 3,
      },
    ]
  )
})
