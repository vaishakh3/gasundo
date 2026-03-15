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

export async function importCatalogPlace(placeId) {
  const response = await fetch('/api/catalog/import', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ placeId }),
  })

  return parseResponse(response, 'Could not import this place right now.')
}
