const AUTH_IDENTITY_PREFIX = 'auth:'
const MAX_LABEL_LENGTH = 48

function normalizeWhitespace(value) {
  return Array.from(String(value || ''))
    .map((character) => {
      const charCode = character.charCodeAt(0)

      return charCode <= 31 || charCode === 127 ? ' ' : character
    })
    .join('')
    .replace(/\s+/g, ' ')
    .trim()
}

function truncateLabel(value) {
  return value.length > MAX_LABEL_LENGTH
    ? value.slice(0, MAX_LABEL_LENGTH).trim()
    : value
}

export function buildLegacyViewerLabel(identityValue) {
  const normalized = normalizeWhitespace(identityValue)

  if (!normalized) {
    return 'Local guest'
  }

  return `Local ${normalized.slice(0, 4).toUpperCase()}`
}

export function buildAuthIdentityKey(userId) {
  const normalizedUserId = normalizeWhitespace(userId)

  if (!normalizedUserId) {
    return null
  }

  return `${AUTH_IDENTITY_PREFIX}${normalizedUserId}`
}

export function buildAuthenticatedViewer(user) {
  if (!user?.id) {
    return null
  }

  const metadata = user.user_metadata || {}
  const displayName = truncateLabel(
    normalizeWhitespace(
      metadata.full_name ||
        metadata.name ||
        metadata.user_name ||
        user.email?.split('@')[0] ||
        'Google user'
    )
  )

  return {
    userId: user.id,
    identityKey: buildAuthIdentityKey(user.id),
    label: displayName || 'Google user',
    email: normalizeWhitespace(user.email) || null,
    avatarUrl:
      normalizeWhitespace(metadata.avatar_url || metadata.picture) || null,
  }
}
