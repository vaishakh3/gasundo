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

export async function updateStatus({ restaurant_name, lat, lng, status, note }) {
  const response = await fetch('/api/statuses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ restaurant_name, lat, lng, status, note }),
  })

  const payload = await parseResponse(
    response,
    'Could not save your update right now.'
  )

  return payload.status
}

export async function confirmStatus(statusId) {
  const response = await fetch(`/api/statuses/${statusId}/confirm`, {
    method: 'POST',
  })

  const payload = await parseResponse(
    response,
    'Could not confirm this update right now.'
  )

  return payload.status
}
