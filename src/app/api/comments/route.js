import { NextResponse } from 'next/server'

import {
  createStatusComment,
  getStatusThreadById,
  listRestaurantComments,
} from '@/lib/comments'
import {
  validateCommentCursor,
  validateCommentRestaurantKey,
  validateCreateCommentPayload,
} from '@/lib/comment-validation'
import { getClientIp } from '@/lib/http'
import { enforceRateLimit, getCommentCreateLimiter } from '@/lib/ratelimit'
import { buildRateLimitKey } from '@/lib/rate-limit-key'
import {
  AuthRequiredError,
  getAuthenticatedViewer,
  requireAuthenticatedViewer,
} from '@/lib/supabase-auth'

export const runtime = 'nodejs'

function jsonError(message, status, headers) {
  return NextResponse.json({ error: message }, { status, headers })
}

export async function GET(request) {
  const url = new URL(request.url)
  const restaurantKeyValidation = validateCommentRestaurantKey(
    url.searchParams.get('restaurantKey')
  )
  const cursorValidation = validateCommentCursor(url.searchParams.get('cursor'))

  if (restaurantKeyValidation.error) {
    return jsonError('A valid restaurant key is required.', 400)
  }

  if (cursorValidation.error) {
    return jsonError(cursorValidation.error, 400)
  }

  try {
    const viewer = await getAuthenticatedViewer()
    const page = await listRestaurantComments(
      restaurantKeyValidation.data,
      viewer?.identityKey || null,
      {
        cursor: cursorValidation.data,
      }
    )

    return NextResponse.json(page, { status: 200 })
  } catch (error) {
    console.error('Failed to load restaurant comments:', error)
    return jsonError('Could not load comments right now.', 500)
  }
}

export async function POST(request) {
  let payload

  try {
    payload = await request.json()
  } catch {
    return jsonError('Invalid JSON payload.', 400)
  }

  const validation = validateCreateCommentPayload(payload)

  if (validation.error) {
    return jsonError(validation.error, 400)
  }

  let viewer

  try {
    viewer = await requireAuthenticatedViewer(
      'Sign in with Google to post a comment.'
    )
  } catch (error) {
    if (error instanceof AuthRequiredError) {
      return jsonError(error.message, 401)
    }

    throw error
  }

  const limiter = getCommentCreateLimiter()
  const clientIp = getClientIp(request.headers)

  try {
    const rateLimitResult = await enforceRateLimit(
      limiter,
      buildRateLimitKey(clientIp, viewer.userId)
    )

    if (!rateLimitResult.success) {
      const retryAfterSeconds = Math.max(
        1,
        Math.ceil((rateLimitResult.reset - Date.now()) / 1000)
      )

      return jsonError(
        'Too many comments from this account right now. Please try again later.',
        429,
        { 'Retry-After': String(retryAfterSeconds) }
      )
    }
  } catch (error) {
    console.error('Comment create rate limit configuration error:', error)
    return jsonError('Comments are temporarily unavailable.', 500)
  }

  try {
    const statusThread = await getStatusThreadById(validation.data.status_id)

    if (!statusThread) {
      return jsonError('Comment thread not found.', 404)
    }

    if (statusThread.restaurant_key !== validation.data.restaurant_key) {
      return jsonError('Comment thread no longer matches this restaurant.', 409)
    }

    const comment = await createStatusComment({
      statusId: validation.data.status_id,
      restaurantKey: validation.data.restaurant_key,
      content: validation.data.content,
      authorIdentityHash: viewer.identityKey,
      authorLabel: viewer.label,
    })

    return NextResponse.json({ comment }, { status: 201 })
  } catch (error) {
    console.error('Failed to create comment:', error)
    return jsonError('Could not post your comment right now.', 500)
  }
}
