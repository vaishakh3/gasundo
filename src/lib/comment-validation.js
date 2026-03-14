import { isUuid } from './uuid.js'
import {
  decodeCommentCursor,
} from './comment-cursor.js'
import { validateCommentMarkdown } from './comment-markdown.js'

export function validateCreateCommentPayload(payload) {
  if (!payload || typeof payload !== 'object') {
    return { error: 'Invalid request body.' }
  }

  const statusId =
    typeof payload.status_id === 'string' ? payload.status_id.trim() : ''

  if (!isUuid(statusId)) {
    return { error: 'A valid status thread is required.' }
  }

  const restaurantKey =
    typeof payload.restaurant_key === 'string'
      ? payload.restaurant_key.trim()
      : ''

  if (!restaurantKey || restaurantKey.length > 220) {
    return { error: 'Restaurant key must be 220 characters or fewer.' }
  }

  const markdownValidation = validateCommentMarkdown(payload.content)

  if (markdownValidation.error) {
    return markdownValidation
  }

  return {
    data: {
      status_id: statusId,
      restaurant_key: restaurantKey,
      content: markdownValidation.data.content,
    },
  }
}

export function validateUpdateCommentPayload(payload) {
  if (!payload || typeof payload !== 'object') {
    return { error: 'Invalid request body.' }
  }

  const markdownValidation = validateCommentMarkdown(payload.content)

  if (markdownValidation.error) {
    return markdownValidation
  }

  return {
    data: {
      content: markdownValidation.data.content,
    },
  }
}

export function validateCommentId(value) {
  const commentId = typeof value === 'string' ? value.trim() : ''

  if (!isUuid(commentId)) {
    return { error: 'Invalid comment id.' }
  }

  return { data: commentId }
}

export function validateCommentThreadStatusId(value) {
  const statusId = typeof value === 'string' ? value.trim() : ''

  if (!isUuid(statusId)) {
    return { error: 'A valid status thread is required.' }
  }

  return { data: statusId }
}

export function validateCommentRestaurantKey(value) {
  const restaurantKey = typeof value === 'string' ? value.trim() : ''

  if (!restaurantKey || restaurantKey.length > 220) {
    return { error: 'A valid restaurant key is required.' }
  }

  return { data: restaurantKey }
}

export function validateCommentCursor(value) {
  if (value == null || value === '') {
    return { data: null }
  }

  const cursor = decodeCommentCursor(value)

  if (!cursor) {
    return { error: 'Invalid comment cursor.' }
  }

  return { data: cursor }
}
