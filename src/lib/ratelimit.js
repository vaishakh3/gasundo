import 'server-only'

function buildBypassRateLimitResult(identifier) {
  return {
    success: true,
    limit: Number.POSITIVE_INFINITY,
    remaining: Number.POSITIVE_INFINITY,
    reset: Date.now(),
    pending: Promise.resolve(),
    reason: 'disabled',
    identifier,
  }
}

// Rate limiting is intentionally disabled for now.
export function getStatusCreateLimiter() {
  return null
}

export function getStatusConfirmLimiter() {
  return null
}

export function getCommentCreateLimiter() {
  return null
}

export function getCommentUpvoteLimiter() {
  return null
}

export async function enforceRateLimit(_limiter, identifier) {
  return buildBypassRateLimitResult(identifier)
}
