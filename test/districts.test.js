import assert from 'node:assert/strict'
import test from 'node:test'

import {
  DEFAULT_DISTRICT_SLUG,
  getDistrictByCoordinates,
  normalizeDistrictSlug,
} from '../src/lib/districts.js'

test('normalizeDistrictSlug falls back to Ernakulam for invalid values', () => {
  assert.equal(normalizeDistrictSlug('Thrissur'), 'thrissur')
  assert.equal(normalizeDistrictSlug(''), DEFAULT_DISTRICT_SLUG)
  assert.equal(normalizeDistrictSlug('not-a-district'), DEFAULT_DISTRICT_SLUG)
})

test('getDistrictByCoordinates resolves common district coordinates', () => {
  assert.equal(getDistrictByCoordinates(9.9312, 76.2673)?.slug, 'ernakulam')
  assert.equal(getDistrictByCoordinates(8.5241, 76.9366)?.slug, 'thiruvananthapuram')
  assert.equal(getDistrictByCoordinates(11.2588, 75.7804)?.slug, 'kozhikode')
})

test('getDistrictByCoordinates returns null outside Kerala', () => {
  assert.equal(getDistrictByCoordinates(13.0827, 80.2707), null)
})
