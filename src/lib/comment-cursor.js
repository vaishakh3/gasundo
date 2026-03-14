import { isUuid } from './uuid.js'

function isValidTimestamp(value) {
  return Boolean(value) && Number.isFinite(new Date(value).valueOf())
}

export function encodeCommentCursor(comment) {
  if (!comment?.id || !comment?.created_at) {
    return null
  }

  return Buffer.from(
    JSON.stringify({
      createdAt: comment.created_at,
      id: comment.id,
    }),
    'utf8'
  ).toString('base64url')
}

export function decodeCommentCursor(cursor) {
  if (!cursor || typeof cursor !== 'string') {
    return null
  }

  try {
    const decoded = JSON.parse(
      Buffer.from(cursor, 'base64url').toString('utf8')
    )

    if (!isValidTimestamp(decoded?.createdAt) || !isUuid(decoded?.id)) {
      return null
    }

    return {
      createdAt: decoded.createdAt,
      id: decoded.id,
    }
  } catch {
    return null
  }
}

export function buildCommentCursorFilter(cursor) {
  if (!cursor?.createdAt || !cursor?.id) {
    return null
  }

  const createdAt = JSON.stringify(cursor.createdAt)
  return `created_at.lt.${createdAt},and(created_at.eq.${createdAt},id.lt.${cursor.id})`
}
