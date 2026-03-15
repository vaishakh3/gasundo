import { getDistrictConfig, normalizeDistrictSlug } from '@/lib/districts'

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

export async function fetchCatalog(districtSlug) {
  const district = normalizeDistrictSlug(districtSlug)
  const districtLabel = getDistrictConfig(district).name
  const url = new URL('/api/catalog', window.location.origin)

  url.searchParams.set('district', district)

  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
    },
  })

  return parseResponse(
    response,
    `Could not load the ${districtLabel} restaurant catalog right now.`
  )
}
