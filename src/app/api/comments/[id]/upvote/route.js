import { NextResponse } from 'next/server'

import { getCommentById, upvoteComment } from '@/lib/comments'
import { validateCommentId } from '@/lib/comment-validation'
import { getClientIp } from '@/lib/http'
import {
  enforceRateLimit,
  getCommentUpvoteLimiter,
} from '@/lib/ratelimit'
import { buildRateLimitKey } from '@/lib/rate-limit-key'
import {
  AuthRequiredError,
  requireAuthenticatedViewer,
} from '@/lib/supabase-auth'

export const runtime = 'nodejs'

function jsonError(message, status, headers) {
  return NextResponse.json({ error: message }, { status, headers })
}

export async function POST(request, context) {
  const params = await Promise.resolve(context.params)
  const validation = validateCommentId(params?.id)

  if (validation.error) {
    return jsonError(validation.error, 400)
  }

  let viewer

  try {
    viewer = await requireAuthenticatedViewer(
      'Sign in with Google to upvote comments.'
    )
  } catch (error) {
    if (error instanceof AuthRequiredError) {
      return jsonError(error.message, 401)
    }

    throw error
  }

  const limiter = getCommentUpvoteLimiter()
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
        'Too many upvotes from this account right now. Please try again later.',
        429,
        { 'Retry-After': String(retryAfterSeconds) }
      )
    }
  } catch (error) {
    console.error('Comment upvote rate limit configuration error:', error)
    return jsonError('Comment voting is temporarily unavailable.', 500)
  }

  try {
    const comment = await getCommentById(validation.data, viewer.identityKey)

    if (!comment) {
      return jsonError('Comment not found.', 404)
    }

    if (comment.is_own_comment) {
      return jsonError('You cannot upvote your own comment.', 400)
    }

    await upvoteComment(validation.data, viewer.identityKey)

    return NextResponse.json(
      {
        comment: await getCommentById(validation.data, viewer.identityKey),
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Failed to upvote comment:', error)
    return jsonError('Could not upvote this comment right now.', 500)
  }
}
