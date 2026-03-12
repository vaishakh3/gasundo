import assert from 'node:assert/strict'
import test from 'node:test'

import {
  buildCatalogIndex,
  selectMapRestaurantIds,
  selectSuggestions,
  selectSummaryCounts,
  selectVisibleRestaurantIds,
} from '../src/lib/catalog-query.js'

const restaurants = [
  {
    restaurant_key: 'alpha-burger::9.90000::76.20000',
    name: 'Alpha Burger',
    brand: 'Alpha',
    lat: 9.9,
    lng: 76.2,
  },
  {
    restaurant_key: 'dominos-kadavanthra::9.91000::76.31000',
    name: 'Dominos Kadavanthra',
    brand: "Domino's",
    lat: 9.91,
    lng: 76.31,
  },
  {
    restaurant_key: 'closed-cafe::9.92000::76.32000',
    name: 'Closed Cafe',
    brand: null,
    lat: 9.92,
    lng: 76.32,
  },
  {
    restaurant_key: 'unknown-bites::9.93000::76.33000',
    name: 'Unknown Bites',
    brand: null,
    lat: 9.93,
    lng: 76.33,
  },
]

const statusSnapshot = {
  [restaurants[0].restaurant_key]: {
    restaurant_key: restaurants[0].restaurant_key,
    status: 'open',
    updated_at: '2026-03-13T09:00:00.000Z',
    confirmations: 3,
  },
  [restaurants[1].restaurant_key]: {
    restaurant_key: restaurants[1].restaurant_key,
    status: 'limited',
    updated_at: '2026-03-13T08:00:00.000Z',
    confirmations: 2,
  },
  [restaurants[2].restaurant_key]: {
    restaurant_key: restaurants[2].restaurant_key,
    status: 'closed',
    updated_at: '2026-03-13T07:00:00.000Z',
    confirmations: 1,
  },
}

test('selectVisibleRestaurantIds returns all restaurants for empty search', () => {
  const catalogIndex = buildCatalogIndex(restaurants)

  const visibleRestaurantIds = selectVisibleRestaurantIds(
    catalogIndex,
    statusSnapshot,
    {
      search: '',
      statusFilter: 'all',
      selectedRestaurantId: null,
    }
  )

  assert.deepEqual(visibleRestaurantIds, [
    restaurants[0].restaurant_key,
    restaurants[1].restaurant_key,
    restaurants[3].restaurant_key,
    restaurants[2].restaurant_key,
  ])
})

test('selectVisibleRestaurantIds matches substring queries and brand queries', () => {
  const catalogIndex = buildCatalogIndex(restaurants)

  assert.deepEqual(
    selectVisibleRestaurantIds(catalogIndex, statusSnapshot, {
      search: 'burger',
      statusFilter: 'all',
      selectedRestaurantId: null,
    }),
    [restaurants[0].restaurant_key]
  )

  assert.deepEqual(
    selectVisibleRestaurantIds(catalogIndex, statusSnapshot, {
      search: 'domino',
      statusFilter: 'all',
      selectedRestaurantId: null,
    }),
    [restaurants[1].restaurant_key]
  )
})

test('selectSuggestions caps results at five unique labels', () => {
  const suggestionRestaurants = Array.from({ length: 6 }, (_, index) => ({
    restaurant_key: `burger-${index}::9.9${index}000::76.2${index}000`,
    name: `Burger ${index}`,
    brand: null,
    lat: 9.9 + index / 1000,
    lng: 76.2 + index / 1000,
  }))
  const catalogIndex = buildCatalogIndex(suggestionRestaurants)

  const suggestions = selectSuggestions(catalogIndex, 'burger')

  assert.equal(suggestions.length, 5)
  assert.deepEqual(
    suggestions.map((suggestion) => suggestion.label),
    ['Burger 0', 'Burger 1', 'Burger 2', 'Burger 3', 'Burger 4']
  )
})

test('selectSummaryCounts stays stable across known and unknown statuses', () => {
  const catalogIndex = buildCatalogIndex(restaurants)

  assert.deepEqual(selectSummaryCounts(catalogIndex, statusSnapshot), {
    open: 1,
    limited: 1,
    closed: 1,
    unknown: 1,
  })
})

test('selectMapRestaurantIds keeps the selected restaurant available', () => {
  const visibleRestaurantIds = [restaurants[0].restaurant_key]

  assert.deepEqual(
    selectMapRestaurantIds(visibleRestaurantIds, restaurants[2].restaurant_key),
    [restaurants[0].restaurant_key, restaurants[2].restaurant_key]
  )
})
