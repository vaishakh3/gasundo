import assert from 'node:assert/strict'
import test from 'node:test'

import { isMissingRelationError } from '../src/lib/supabase-errors.js'

test('isMissingRelationError matches PostgREST schema cache misses', () => {
  assert.equal(
    isMissingRelationError({
      code: 'PGRST205',
      message:
        "Could not find the table 'public.restaurant_latest_status' in the schema cache",
    }),
    true
  )
})

test('isMissingRelationError rejects unrelated Supabase errors', () => {
  assert.equal(
    isMissingRelationError({
      code: '42501',
      message: 'permission denied for table restaurant_status',
    }),
    false
  )
})
