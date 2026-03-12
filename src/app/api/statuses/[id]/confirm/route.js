import { NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'

import { getClientIp } from '@/lib/http'
import { enforceRateLimit, getStatusConfirmLimiter } from '@/lib/ratelimit'
import { confirmStatus, STATUS_SNAPSHOT_CACHE_TAG } from '@/lib/statuses'
import { validateStatusId } from '@/lib/status-validation'

export const runtime = 'nodejs'

function jsonError(message, status, headers) {
  return NextResponse.json({ error: message }, { status, headers })
}

export async function POST(request, context) {
  const params = await Promise.resolve(context.params)
  const validation = validateStatusId(params?.id)

  if (validation.error) {
    return jsonError(validation.error, 400)
  }

  const limiter = getStatusConfirmLimiter()
  const clientIp = getClientIp(request.headers)

  let rateLimitResult

  try {
    rateLimitResult = await enforceRateLimit(limiter, clientIp)
  } catch (error) {
    console.error('Status confirm rate limit configuration error:', error)
    return jsonError('Status confirmations are temporarily unavailable.', 500)
  }

  if (!rateLimitResult.success) {
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((rateLimitResult.reset - Date.now()) / 1000)
    )

    return jsonError(
      'Too many confirmations from this network. Please try again later.',
      429,
      { 'Retry-After': String(retryAfterSeconds) }
    )
  }

  try {
    const status = await confirmStatus(validation.data)
    revalidateTag(STATUS_SNAPSHOT_CACHE_TAG)
    return NextResponse.json({ status }, { status: 200 })
  } catch (error) {
    console.error('Failed to confirm status update:', error)
    return jsonError('Could not confirm this update right now.', 500)
  }
}
