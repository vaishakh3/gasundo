import { NextResponse } from 'next/server'

import {
  deleteStatusComment,
  getCommentById,
  updateStatusComment,
} from '@/lib/comments'
import {
  validateCommentId,
  validateUpdateCommentPayload,
} from '@/lib/comment-validation'
import { getClientIp } from '@/lib/http'
import {
  enforceRateLimit,
  getCommentDeleteLimiter,
  getCommentEditLimiter,
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

async function requireOwnedComment(commentId, viewerIdentityKey) {
  const comment = await getCommentById(commentId, viewerIdentityKey)

  if (!comment) {
    return { error: 'Comment not found.', status: 404 }
  }

  if (!comment.is_own_comment) {
    return { error: 'You can only manage your own comments.', status: 403 }
  }

  return { comment }
}

async function requireViewerForCommentAction(message) {
  try {
    return { viewer: await requireAuthenticatedViewer(message) }
  } catch (error) {
    if (error instanceof AuthRequiredError) {
      return { error: error.message, status: 401 }
    }

    throw error
  }
}

async function enforceCommentActionRateLimit(request, limiter, userId, message) {
  const clientIp = getClientIp(request.headers)

  try {
    const rateLimitResult = await enforceRateLimit(
      limiter,
      buildRateLimitKey(clientIp, userId)
    )

    if (rateLimitResult.success) {
      return null
    }

    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((rateLimitResult.reset - Date.now()) / 1000)
    )

    return jsonError(message, 429, {
      'Retry-After': String(retryAfterSeconds),
    })
  } catch (error) {
    console.error('Comment mutation rate limit configuration error:', error)
    return jsonError('Comments are temporarily unavailable.', 500)
  }
}

export async function PATCH(request, context) {
  const params = await Promise.resolve(context.params)
  const commentIdValidation = validateCommentId(params?.id)

  if (commentIdValidation.error) {
    return jsonError(commentIdValidation.error, 400)
  }

  let payload

  try {
    payload = await request.json()
  } catch {
    return jsonError('Invalid JSON payload.', 400)
  }

  const payloadValidation = validateUpdateCommentPayload(payload)

  if (payloadValidation.error) {
    return jsonError(payloadValidation.error, 400)
  }

  const authResult = await requireViewerForCommentAction(
    'Sign in with Google to edit your comment.'
  )

  if (authResult.error) {
    return jsonError(authResult.error, authResult.status)
  }

  const rateLimitResponse = await enforceCommentActionRateLimit(
    request,
    getCommentEditLimiter(),
    authResult.viewer.userId,
    'Too many comment edits from this account right now. Please try again later.'
  )

  if (rateLimitResponse) {
    return rateLimitResponse
  }

  try {
    const ownership = await requireOwnedComment(
      commentIdValidation.data,
      authResult.viewer.identityKey
    )

    if (ownership.error) {
      return jsonError(ownership.error, ownership.status)
    }

    const comment = await updateStatusComment({
      commentId: commentIdValidation.data,
      content: payloadValidation.data.content,
      authorIdentityHash: authResult.viewer.identityKey,
    })

    return NextResponse.json({ comment }, { status: 200 })
  } catch (error) {
    console.error('Failed to update comment:', error)
    return jsonError('Could not update this comment right now.', 500)
  }
}

export async function DELETE(request, context) {
  const params = await Promise.resolve(context.params)
  const commentIdValidation = validateCommentId(params?.id)

  if (commentIdValidation.error) {
    return jsonError(commentIdValidation.error, 400)
  }

  const authResult = await requireViewerForCommentAction(
    'Sign in with Google to delete your comment.'
  )

  if (authResult.error) {
    return jsonError(authResult.error, authResult.status)
  }

  const rateLimitResponse = await enforceCommentActionRateLimit(
    request,
    getCommentDeleteLimiter(),
    authResult.viewer.userId,
    'Too many comment deletions from this account right now. Please try again later.'
  )

  if (rateLimitResponse) {
    return rateLimitResponse
  }

  try {
    const ownership = await requireOwnedComment(
      commentIdValidation.data,
      authResult.viewer.identityKey
    )

    if (ownership.error) {
      return jsonError(ownership.error, ownership.status)
    }

    const deletedComment = await deleteStatusComment({
      commentId: commentIdValidation.data,
      authorIdentityHash: authResult.viewer.identityKey,
    })

    if (!deletedComment?.id) {
      return jsonError('Comment not found.', 404)
    }

    return NextResponse.json(
      { deleted: true, commentId: deletedComment.id },
      { status: 200 }
    )
  } catch (error) {
    console.error('Failed to delete comment:', error)
    return jsonError('Could not delete this comment right now.', 500)
  }
}
