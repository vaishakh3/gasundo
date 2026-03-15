import assert from 'node:assert/strict'
import test from 'node:test'

import { shouldLogPlaceOpen } from '../src/lib/analytics-client.js'

test('shouldLogPlaceOpen logs the first selected restaurant', () => {
  assert.equal(shouldLogPlaceOpen(null, 'alpha-burger', true), true)
})

test('shouldLogPlaceOpen ignores rerenders for the same selected restaurant', () => {
  assert.equal(shouldLogPlaceOpen('alpha-burger', 'alpha-burger', true), false)
})

test('shouldLogPlaceOpen logs when selection switches to a different restaurant', () => {
  assert.equal(shouldLogPlaceOpen('alpha-burger', 'beta-cafe', true), true)
})

test('shouldLogPlaceOpen waits until the selected restaurant record exists', () => {
  assert.equal(shouldLogPlaceOpen(null, 'shared-link-place', false), false)
})
