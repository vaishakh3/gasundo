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

export async function fetchStatusSnapshot() {
  const response = await fetch('/api/status-snapshot', {
    headers: {
      Accept: 'application/json',
    },
  })

  return parseResponse(
    response,
    'Could not load the latest status snapshot right now.'
  )
}
