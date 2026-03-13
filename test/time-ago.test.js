import assert from 'node:assert/strict'
import test from 'node:test'

import { formatTimeAgo, isTimestampStale } from '../src/lib/time-ago.js'

test('formatTimeAgo returns a stable fallback when no render timestamp is provided', () => {
  assert.equal(formatTimeAgo('2026-03-13T03:00:00.000Z'), 'recently')
})

test('isTimestampStale stays false when no render timestamp is provided', () => {
  assert.equal(isTimestampStale('2026-03-11T03:00:00.000Z'), false)
})

test('formatTimeAgo still computes relative time when a timestamp is provided', () => {
  assert.equal(
    formatTimeAgo('2026-03-13T03:00:00.000Z', Date.parse('2026-03-13T05:00:00.000Z')),
    '2h ago'
  )
})
