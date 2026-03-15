import { NextResponse } from 'next/server'

import {
  incrementAnalyticsCounter,
  validatePlaceOpenPayload,
} from '@/lib/analytics'
import { getClientIp } from '@/lib/http'
import { enforceRateLimit, getPlaceOpenLimiter } from '@/lib/ratelimit'
import { buildRateLimitKey } from '@/lib/rate-limit-key'
import { getRestaurants } from '@/lib/restaurants'

export const runtime = 'nodejs'

function jsonError(message, status, headers) {
  return NextResponse.json({ error: message }, { status, headers })
}

function getAnalyticsSessionKey(requestHeaders) {
  const rawSessionKey = requestHeaders.get('x-gasundo-session')

  if (typeof rawSessionKey !== 'string') {
    return null
  }

  const sessionKey = rawSessionKey.trim()

  if (!sessionKey || sessionKey.length > 120) {
    return null
  }

  return sessionKey
}

export async function POST(request) {
  let payload

  try {
    payload = await request.json()
  } catch {
    return jsonError('Invalid JSON payload.', 400)
  }

  const validation = validatePlaceOpenPayload(payload)

  if (validation.error) {
    return jsonError(validation.error, 400)
  }

  const limiter = getPlaceOpenLimiter()
  const clientIp = getClientIp(request.headers)
  const sessionKey = getAnalyticsSessionKey(request.headers)

  try {
    const rateLimitResult = await enforceRateLimit(
      limiter,
      buildRateLimitKey(clientIp, sessionKey)
    )

    if (!rateLimitResult.success) {
      const retryAfterSeconds = Math.max(
        1,
        Math.ceil((rateLimitResult.reset - Date.now()) / 1000)
      )

      return jsonError(
        'Too many place opens from this session right now. Please try again later.',
        429,
        { 'Retry-After': String(retryAfterSeconds) }
      )
    }
  } catch (error) {
    console.error('Place open rate limit configuration error:', error)
    return jsonError('Place-open analytics are temporarily unavailable.', 500)
  }

  try {
    const restaurants = await getRestaurants()
    const restaurant = restaurants.find(
      (catalogRestaurant) =>
        catalogRestaurant.restaurant_key === validation.data.restaurant_key
    )

    if (!restaurant) {
      return jsonError('Restaurant not found.', 404)
    }

    await incrementAnalyticsCounter({
      metric: 'place_open',
      restaurantKey: restaurant.restaurant_key,
      restaurantName: restaurant.name,
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('Failed to record place open analytics:', error)
    return jsonError('Could not record this place-open event right now.', 500)
  }
}
