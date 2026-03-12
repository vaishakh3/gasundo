import assert from 'node:assert/strict'
import test from 'node:test'

import { buildRestaurantKey } from '../src/lib/status-key.js'

test('buildRestaurantKey normalizes the name and rounds coordinates', () => {
  assert.equal(
    buildRestaurantKey({
      restaurant_name: 'Cafe Dé-Lite',
      lat: 9.931234,
      lng: 76.267891,
    }),
    'cafe-de-lite::9.93123::76.26789'
  )
})
