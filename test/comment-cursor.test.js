import assert from 'node:assert/strict'
import test from 'node:test'

import {
  buildCommentCursorFilter,
  decodeCommentCursor,
  encodeCommentCursor,
} from '../src/lib/comment-cursor.js'

test('comment cursor encodes and decodes a comment position', () => {
  const cursor = encodeCommentCursor({
    id: '9f4d3b58-3c2b-4a40-9b2e-8d9c18d4f1a7',
    created_at: '2026-03-14T10:00:00.000Z',
  })

  assert.deepEqual(decodeCommentCursor(cursor), {
    id: '9f4d3b58-3c2b-4a40-9b2e-8d9c18d4f1a7',
    createdAt: '2026-03-14T10:00:00.000Z',
  })

  assert.equal(
    buildCommentCursorFilter(decodeCommentCursor(cursor)),
    'created_at.lt."2026-03-14T10:00:00.000Z",and(created_at.eq."2026-03-14T10:00:00.000Z",id.lt.9f4d3b58-3c2b-4a40-9b2e-8d9c18d4f1a7)'
  )
})

test('comment cursor rejects malformed values', () => {
  assert.equal(decodeCommentCursor('bad-cursor'), null)
})
