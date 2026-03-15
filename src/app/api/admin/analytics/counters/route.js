import { NextResponse } from 'next/server'

import {
  normalizeAnalyticsLimit,
  readAnalyticsCounters,
  validateAnalyticsMetric,
} from '@/lib/analytics'
import { readEnvValue } from '@/lib/supabase-env'

export const runtime = 'nodejs'

function jsonError(message, status) {
  return NextResponse.json({ error: message }, { status })
}

function authorizeAnalyticsAdmin(requestHeaders) {
  const configuredToken = readEnvValue('ANALYTICS_READ_TOKEN')

  if (!configuredToken) {
    return { error: 'Analytics admin access is not configured.', status: 500 }
  }

  const authorizationHeader = requestHeaders.get('authorization')

  if (!authorizationHeader?.startsWith('Bearer ')) {
    return { error: 'Missing analytics admin bearer token.', status: 401 }
  }

  const bearerToken = authorizationHeader.slice('Bearer '.length).trim()

  if (bearerToken !== configuredToken) {
    return { error: 'Invalid analytics admin bearer token.', status: 401 }
  }

  return { error: null, status: 200 }
}

export async function GET(request) {
  const authorization = authorizeAnalyticsAdmin(request.headers)

  if (authorization.error) {
    return jsonError(authorization.error, authorization.status)
  }

  const requestUrl = new URL(request.url)
  const metricValidation = validateAnalyticsMetric(
    requestUrl.searchParams.get('metric')
  )

  if (metricValidation.error) {
    return jsonError(metricValidation.error, 400)
  }

  const normalizedLimit = normalizeAnalyticsLimit(
    requestUrl.searchParams.get('limit')
  )

  if (!normalizedLimit) {
    return jsonError('Limit must be a positive integer.', 400)
  }

  try {
    const counters = await readAnalyticsCounters({
      metric: metricValidation.data,
      from: requestUrl.searchParams.get('from'),
      to: requestUrl.searchParams.get('to'),
      limit: normalizedLimit,
    })

    return NextResponse.json(counters, { status: 200 })
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Could not load analytics counters right now.'

    if (
      message === 'The from date must be a valid YYYY-MM-DD value.' ||
      message === 'The to date must be a valid YYYY-MM-DD value.' ||
      message === 'The from date must be earlier than or equal to the to date.' ||
      message === 'Limit must be a positive integer.'
    ) {
      return jsonError(message, 400)
    }

    console.error('Failed to load analytics counters:', error)
    return jsonError('Could not load analytics counters right now.', 500)
  }
}
