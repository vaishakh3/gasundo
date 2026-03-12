import assert from 'node:assert/strict'
import test from 'node:test'

import {
  createStrongEtag,
  isEtagFresh,
} from '../src/lib/http-cache.js'

test('createStrongEtag is stable for the same payload', () => {
  const payload = { restaurants: ['a', 'b'], version: 1 }

  assert.equal(createStrongEtag(payload), createStrongEtag(payload))
})

test('isEtagFresh matches exact and comma-separated etags', () => {
  const etag = createStrongEtag({ value: 'snapshot' })

  assert.equal(isEtagFresh(etag, etag), true)
  assert.equal(isEtagFresh(`"old", ${etag}`, etag), true)
  assert.equal(isEtagFresh('"different"', etag), false)
})
