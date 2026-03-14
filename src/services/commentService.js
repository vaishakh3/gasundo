async function parseResponse(response, fallbackMessage) {
  let payload = null

  try {
    payload = await response.json()
  } catch {
    payload = null
  }

  if (!response.ok) {
    throw new Error(payload?.error || fallbackMessage)
  }

  return payload
}

export async function fetchRestaurantComments({ restaurantKey, cursor = null }) {
  const params = new URLSearchParams()

  if (restaurantKey) {
    params.set('restaurantKey', restaurantKey)
  }

  if (cursor) {
    params.set('cursor', cursor)
  }

  const response = await fetch(`/api/comments?${params.toString()}`, {
    headers: {
      Accept: 'application/json',
    },
    cache: 'no-store',
  })

  const payload = await parseResponse(
    response,
    'Could not load comments right now.'
  )

  return {
    comments: payload.comments || [],
    nextCursor: payload.nextCursor || null,
    hasMore: Boolean(payload.hasMore),
  }
}

export async function createComment({ status_id, restaurant_key, content }) {
  const response = await fetch('/api/comments', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      status_id,
      restaurant_key,
      content,
    }),
  })

  const payload = await parseResponse(
    response,
    'Could not post your comment right now.'
  )

  return payload.comment
}

export async function upvoteComment(commentId) {
  const response = await fetch(`/api/comments/${commentId}/upvote`, {
    method: 'POST',
  })

  const payload = await parseResponse(
    response,
    'Could not upvote this comment right now.'
  )

  return payload.comment
}

export async function updateComment(commentId, content) {
  const response = await fetch(`/api/comments/${commentId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ content }),
  })

  const payload = await parseResponse(
    response,
    'Could not update this comment right now.'
  )

  return payload.comment
}

export async function deleteComment(commentId) {
  const response = await fetch(`/api/comments/${commentId}`, {
    method: 'DELETE',
  })

  return parseResponse(response, 'Could not delete this comment right now.')
}
