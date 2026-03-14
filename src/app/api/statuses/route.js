import { NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'

import { getClientIp } from '@/lib/http'
import { enforceRateLimit, getStatusCreateLimiter } from '@/lib/ratelimit'
import { buildRateLimitKey } from '@/lib/rate-limit-key'
import {
  AuthRequiredError,
  requireAuthenticatedViewer,
} from '@/lib/supabase-auth'
import {
  applyViewerStatusState,
  createStatus,
  STATUS_SNAPSHOT_CACHE_TAG,
} from '@/lib/statuses'
import { validateCreateStatusPayload } from '@/lib/status-validation'

export const runtime = 'nodejs'

function jsonError(message, status, headers) {
  return NextResponse.json({ error: message }, { status, headers })
}

export async function POST(request) {
  let payload

  try {
    payload = await request.json()
  } catch {
    return jsonError('Invalid JSON payload.', 400)
  }

  const validation = validateCreateStatusPayload(payload)

  if (validation.error) {
    return jsonError(validation.error, 400)
  }

  let viewer

  try {
    viewer = await requireAuthenticatedViewer(
      'Sign in with Google to report a status.'
    )
  } catch (error) {
    if (error instanceof AuthRequiredError) {
      return jsonError(error.message, 401)
    }

    throw error
  }

  const limiter = getStatusCreateLimiter()
  const clientIp = getClientIp(request.headers)

  let rateLimitResult

  try {
    rateLimitResult = await enforceRateLimit(
      limiter,
      buildRateLimitKey(clientIp, viewer.userId)
    )
  } catch (error) {
    console.error('Status create rate limit configuration error:', error)
    return jsonError('Status updates are temporarily unavailable.', 500)
  }

  if (!rateLimitResult.success) {
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((rateLimitResult.reset - Date.now()) / 1000)
    )

    return jsonError(
      'Too many updates from this account right now. Please try again later.',
      429,
      { 'Retry-After': String(retryAfterSeconds) }
    )
  }

  try {
    const status = await createStatus({
      ...validation.data,
      authorIdentityHash: viewer.identityKey,
      authorLabel: viewer.label,
    })
    revalidateTag(STATUS_SNAPSHOT_CACHE_TAG, 'max')
    return NextResponse.json(
      {
        status: applyViewerStatusState(status, {
          viewer_is_author: true,
          viewer_has_confirmed: false,
        }),
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Failed to create status update:', error)
    return jsonError('Could not save your update right now.', 500)
  }
}
