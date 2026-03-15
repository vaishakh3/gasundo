const ANALYTICS_SESSION_STORAGE_KEY = 'gasundo.analytics.session'

function generateAnalyticsSessionId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `session-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

function getAnalyticsSessionId() {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    const existingSessionId = window.sessionStorage.getItem(
      ANALYTICS_SESSION_STORAGE_KEY
    )

    if (existingSessionId) {
      return existingSessionId
    }

    const nextSessionId = generateAnalyticsSessionId()
    window.sessionStorage.setItem(ANALYTICS_SESSION_STORAGE_KEY, nextSessionId)
    return nextSessionId
  } catch {
    return null
  }
}

export async function logPlaceOpen({
  restaurant_key,
  restaurant_name,
  district_slug,
}) {
  const headers = {
    'Content-Type': 'application/json',
  }
  const sessionId = getAnalyticsSessionId()

  if (sessionId) {
    headers['x-gasundo-session'] = sessionId
  }

  const response = await fetch('/api/analytics/place-open', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      restaurant_key,
      restaurant_name,
      district_slug: district_slug || null,
    }),
    keepalive: true,
  })

  if (!response.ok) {
    throw new Error('Could not record this place-open event right now.')
  }
}
