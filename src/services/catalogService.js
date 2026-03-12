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

export async function fetchCatalog() {
  const response = await fetch('/api/catalog', {
    headers: {
      Accept: 'application/json',
    },
  })

  return parseResponse(response, 'Could not load the restaurant catalog right now.')
}
