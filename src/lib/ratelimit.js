import 'server-only'

import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

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

const LOCAL_DEV_BYPASS =
  process.env.NODE_ENV !== 'production' &&
  process.env.ENABLE_RATE_LIMITS !== 'true'

let cachedRedisClient
let cachedLimiters

function readRedisEnvValue(name) {
  const value = process.env[name]

  if (typeof value !== 'string') {
    return null
  }

  const normalized = value.trim().replace(/^"(.*)"$/, '$1')
  return normalized || null
}

function getRedisClient() {
  if (cachedRedisClient !== undefined) {
    return cachedRedisClient
  }

  const url = readRedisEnvValue('UPSTASH_REDIS_REST_URL')
  const token = readRedisEnvValue('UPSTASH_REDIS_REST_TOKEN')

  if (!url || !token) {
    if (LOCAL_DEV_BYPASS) {
      cachedRedisClient = null
      return cachedRedisClient
    }

    throw new Error('Upstash Redis credentials are missing.')
  }

  cachedRedisClient = new Redis({ url, token })
  return cachedRedisClient
}

function createSlidingWindowLimiter(prefix, limit, windowSize) {
  if (LOCAL_DEV_BYPASS) {
    return null
  }

  const redis = getRedisClient()

  if (!redis) {
    return null
  }

  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(limit, windowSize),
    analytics: true,
    prefix: `gasundo:${prefix}`,
  })
}

function getLimiters() {
  if (!cachedLimiters) {
    cachedLimiters = {
      statusCreate: createSlidingWindowLimiter('status-create', 6, '60 m'),
      statusConfirm: createSlidingWindowLimiter('status-confirm', 20, '60 m'),
      commentCreate: createSlidingWindowLimiter('comment-create', 6, '10 m'),
      commentEdit: createSlidingWindowLimiter('comment-edit', 12, '10 m'),
      commentDelete: createSlidingWindowLimiter('comment-delete', 6, '10 m'),
      commentUpvote: createSlidingWindowLimiter('comment-upvote', 30, '10 m'),
    }
  }

  return cachedLimiters
}

export function getStatusCreateLimiter() {
  return getLimiters().statusCreate
}

export function getStatusConfirmLimiter() {
  return getLimiters().statusConfirm
}

export function getCommentCreateLimiter() {
  return getLimiters().commentCreate
}

export function getCommentEditLimiter() {
  return getLimiters().commentEdit
}

export function getCommentDeleteLimiter() {
  return getLimiters().commentDelete
}

export function getCommentUpvoteLimiter() {
  return getLimiters().commentUpvote
}

export async function enforceRateLimit(_limiter, identifier) {
  if (!_limiter) {
    return buildBypassRateLimitResult(identifier)
  }

  return _limiter.limit(identifier)
}
