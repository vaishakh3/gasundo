import assert from 'node:assert/strict'
import test from 'node:test'

import { validateCommentMarkdown } from '../src/lib/comment-markdown.js'

test('validateCommentMarkdown accepts the safe markdown subset', () => {
  const result = validateCommentMarkdown(
    '**Open** tonight\n\n- card only\n- kitchen closes early\n\n[map](https://example.com)'
  )

  assert.equal(result.error, undefined)
  assert.equal(result.data.content.includes('**Open**'), true)
})

test('validateCommentMarkdown rejects unsupported markdown features', () => {
  assert.deepEqual(validateCommentMarkdown('# Heading'), {
    error: 'Headings are not allowed in comments.',
  })
})

test('validateCommentMarkdown rejects unsafe links', () => {
  assert.deepEqual(validateCommentMarkdown('[bad](javascript:alert(1))'), {
    error: 'Only http and https links are allowed in comments.',
  })
})
