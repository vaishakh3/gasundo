import assert from 'node:assert/strict'
import test from 'node:test'

import {
  validateCommentId,
  validateCommentCursor,
  validateCommentRestaurantKey,
  validateCommentThreadStatusId,
  validateCreateCommentPayload,
  validateUpdateCommentPayload,
} from '../src/lib/comment-validation.js'

test('validateCreateCommentPayload accepts a valid comment payload', () => {
  assert.deepEqual(
    validateCreateCommentPayload({
      status_id: '9f4d3b58-3c2b-4a40-9b2e-8d9c18d4f1a7',
      restaurant_key: 'probe-cafe::9.96723::76.24567',
      content: 'Kitchen is open but card payments are slow tonight.',
    }),
    {
      data: {
        status_id: '9f4d3b58-3c2b-4a40-9b2e-8d9c18d4f1a7',
        restaurant_key: 'probe-cafe::9.96723::76.24567',
        content: 'Kitchen is open but card payments are slow tonight.',
      },
    }
  )
})

test('validateCreateCommentPayload rejects empty comments', () => {
  assert.deepEqual(
    validateCreateCommentPayload({
      status_id: '9f4d3b58-3c2b-4a40-9b2e-8d9c18d4f1a7',
      restaurant_key: 'probe-cafe::9.96723::76.24567',
      content: '   ',
    }),
    {
      error: 'Comment text is required.',
    }
  )
})

test('comment validators reject malformed ids', () => {
  assert.deepEqual(validateCommentId('oops'), {
    error: 'Invalid comment id.',
  })

  assert.deepEqual(validateCommentThreadStatusId('oops'), {
    error: 'A valid status thread is required.',
  })

  assert.deepEqual(validateCommentRestaurantKey(''), {
    error: 'A valid restaurant key is required.',
  })

  assert.deepEqual(validateCommentCursor('bad-cursor'), {
    error: 'Invalid comment cursor.',
  })
})

test('comment validators reject unsupported markdown and accept updates', () => {
  assert.deepEqual(
    validateCreateCommentPayload({
      status_id: '9f4d3b58-3c2b-4a40-9b2e-8d9c18d4f1a7',
      restaurant_key: 'probe-cafe::9.96723::76.24567',
      content: '<script>alert(1)</script>',
    }),
    {
      error: 'Raw HTML is not allowed in comments.',
    }
  )

  assert.deepEqual(
    validateUpdateCommentPayload({
      content: '*Updated* info with [link](https://example.com)',
    }),
    {
      data: {
        content: '*Updated* info with [link](https://example.com)',
      },
    }
  )
})
