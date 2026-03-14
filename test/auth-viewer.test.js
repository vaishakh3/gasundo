import assert from 'node:assert/strict'
import test from 'node:test'

import {
  buildAuthenticatedViewer,
  buildLegacyViewerLabel,
} from '../src/lib/auth-viewer.js'

test('buildAuthenticatedViewer maps a Supabase user to an auth identity', () => {
  const viewer = buildAuthenticatedViewer({
    id: 'user-123',
    email: 'kochiguest@example.com',
    user_metadata: {
      full_name: 'Kochi Diner',
      avatar_url: 'https://example.com/avatar.png',
    },
  })

  assert.deepEqual(viewer, {
    userId: 'user-123',
    identityKey: 'auth:user-123',
    label: 'Kochi Diner',
    email: 'kochiguest@example.com',
    avatarUrl: 'https://example.com/avatar.png',
  })
})

test('buildLegacyViewerLabel falls back for missing legacy identities', () => {
  assert.equal(buildLegacyViewerLabel('abcd1234'), 'Local ABCD')
  assert.equal(buildLegacyViewerLabel(''), 'Local guest')
})
