import { NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'

import { getClientIp } from '@/lib/http'
import { enforceRateLimit, getStatusConfirmLimiter } from '@/lib/ratelimit'
import { buildRateLimitKey } from '@/lib/rate-limit-key'
import {
  AuthRequiredError,
  requireAuthenticatedViewer,
} from '@/lib/supabase-auth'
import {
  applyViewerStatusState,
  confirmStatus,
  getViewerStatusState,
  StatusAlreadyConfirmedError,
  StatusSelfConfirmationError,
  STATUS_SNAPSHOT_CACHE_TAG,
} from '@/lib/statuses'
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

  let viewer

  try {
    viewer = await requireAuthenticatedViewer(
      'Sign in with Google to confirm a status.'
    )
  } catch (error) {
    if (error instanceof AuthRequiredError) {
      return jsonError(error.message, 401)
    }

    throw error
  }

  const limiter = getStatusConfirmLimiter()
  const clientIp = getClientIp(request.headers)

  let rateLimitResult

  try {
    rateLimitResult = await enforceRateLimit(
      limiter,
      buildRateLimitKey(clientIp, viewer.userId)
    )
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
      'Too many confirmations from this account right now. Please try again later.',
      429,
      { 'Retry-After': String(retryAfterSeconds) }
    )
  }

  try {
    const viewerStateByStatusId = await getViewerStatusState(
      [validation.data],
      viewer.identityKey
    )
    const viewerState = viewerStateByStatusId.get(validation.data)

    if (!viewerState?.exists) {
      return jsonError('Status not found.', 404)
    }

    if (viewerState.viewer_is_author) {
      return jsonError('You cannot confirm your own report.', 400)
    }

    if (viewerState.viewer_has_confirmed) {
      return jsonError(
        'You already confirmed this update from your account.',
        400
      )
    }

    const status = await confirmStatus(validation.data, viewer.identityKey)
    revalidateTag(STATUS_SNAPSHOT_CACHE_TAG, 'max')
    return NextResponse.json(
      {
        status: applyViewerStatusState(status, {
          viewer_is_author: false,
          viewer_has_confirmed: true,
        }),
      },
      { status: 200 }
    )
  } catch (error) {
    if (error instanceof StatusSelfConfirmationError) {
      return jsonError(error.message, 400)
    }

    if (error instanceof StatusAlreadyConfirmedError) {
      return jsonError(error.message, 400)
    }

    console.error('Failed to confirm status update:', error)
    return jsonError('Could not confirm this update right now.', 500)
  }
}
