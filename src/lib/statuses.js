import 'server-only'

import { unstable_cache } from 'next/cache'

import { buildRestaurantKey, getRestaurantKey } from './status-key.js'
import { isMissingRelationError } from './supabase-errors.js'
import { getSupabaseAdmin, requireSupabaseAdmin } from './supabase-admin.js'

const STATUS_SNAPSHOT_CACHE_TTL_SECONDS = 15
export const STATUS_SNAPSHOT_CACHE_TAG = 'status-snapshot'
const LATEST_STATUS_TABLE = 'restaurant_latest_status'
const SELF_CONFIRMATION_ERROR = 'STATUS_SELF_CONFIRMATION_NOT_ALLOWED'
const ALREADY_CONFIRMED_ERROR = 'STATUS_ALREADY_CONFIRMED'

export class StatusAlreadyConfirmedError extends Error {
  constructor(message = 'You already confirmed this update from your account.') {
    super(message)
    this.name = 'StatusAlreadyConfirmedError'
  }
}

export class StatusSelfConfirmationError extends Error {
  constructor(message = 'You cannot confirm your own report.') {
    super(message)
    this.name = 'StatusSelfConfirmationError'
  }
}

function toLatestStatusRecord(result) {
  if (!result || typeof result !== 'object') {
    return null
  }

  const id = result.status_id ?? result.id ?? null

  return {
    id,
    restaurant_key: getRestaurantKey(result),
    restaurant_name: result.restaurant_name,
    lat: Number(result.lat),
    lng: Number(result.lng),
    status: result.status,
    note: result.note || null,
    confirmations: Number(result.confirmations || 0),
    updated_at: result.updated_at || null,
    created_at: result.created_at || null,
    viewer_has_confirmed: Boolean(result.viewer_has_confirmed),
    viewer_is_author: Boolean(result.viewer_is_author),
  }
}

function normalizeStatusResult(result) {
  if (Array.isArray(result)) {
    return toLatestStatusRecord(result[0] ?? null)
  }

  return toLatestStatusRecord(result)
}

function hasCompleteStatusPayload(status) {
  return Boolean(
    status?.restaurant_key &&
      status?.restaurant_name &&
      Number.isFinite(status?.lat) &&
      Number.isFinite(status?.lng)
  )
}

export function applyViewerStatusState(status, viewerState) {
  if (!status) {
    return null
  }

  return {
    ...status,
    viewer_has_confirmed: Boolean(
      viewerState?.viewer_has_confirmed ?? status.viewer_has_confirmed
    ),
    viewer_is_author: Boolean(
      viewerState?.viewer_is_author ?? status.viewer_is_author
    ),
  }
}

export async function getViewerStatusState(statusIds, viewerIdentityHash) {
  const uniqueStatusIds = [...new Set((statusIds || []).filter(Boolean))]

  if (uniqueStatusIds.length === 0) {
    return new Map()
  }

  const supabase = requireSupabaseAdmin()
  const { data: statusRows, error: statusError } = await supabase
    .from('restaurant_status')
    .select('id, author_identity_hash')
    .in('id', uniqueStatusIds)

  if (statusError) {
    throw statusError
  }

  let confirmedStatusIds = new Set()

  if (viewerIdentityHash) {
    const { data: confirmationRows, error: confirmationError } = await supabase
      .from('restaurant_status_confirmations')
      .select('status_id')
      .eq('confirmer_identity_hash', viewerIdentityHash)
      .in('status_id', uniqueStatusIds)

    if (confirmationError) {
      throw confirmationError
    }

    confirmedStatusIds = new Set(
      (confirmationRows || []).map((confirmationRow) => confirmationRow.status_id)
    )
  }

  const statusRowsById = new Map(
    (statusRows || []).map((statusRow) => [statusRow.id, statusRow])
  )

  return new Map(
    uniqueStatusIds.map((statusId) => {
      const statusRow = statusRowsById.get(statusId)

      return [
        statusId,
        {
          exists: Boolean(statusRow),
          viewer_is_author:
            Boolean(viewerIdentityHash) &&
            Boolean(statusRow?.author_identity_hash) &&
            statusRow.author_identity_hash === viewerIdentityHash,
          viewer_has_confirmed: confirmedStatusIds.has(statusId),
        },
      ]
    })
  )
}

async function fetchStatusById(supabase, statusId) {
  const { data, error } = await supabase
    .from('restaurant_status')
    .select('*')
    .eq('id', statusId)
    .single()

  if (error) {
    throw error
  }

  return toLatestStatusRecord(data)
}

async function fetchLatestStatusesFromProjection(supabase) {
  const { data, error } = await supabase.from(LATEST_STATUS_TABLE).select('*')

  if (error) {
    throw error
  }

  const statuses = {}

  for (const row of data ?? []) {
    const status = toLatestStatusRecord(row)

    if (status) {
      statuses[status.restaurant_key] = status
    }
  }

  return statuses
}

async function fetchLatestStatusesFromHistory(supabase) {
  const { data, error } = await supabase
    .from('restaurant_status')
    .select('*')
    .order('updated_at', { ascending: false })

  if (error) {
    throw error
  }

  const statuses = {}

  for (const row of data ?? []) {
    const status = toLatestStatusRecord(row)

    if (status && !statuses[status.restaurant_key]) {
      statuses[status.restaurant_key] = status
    }
  }

  return statuses
}

export async function loadLatestStatusSnapshot() {
  const supabase = getSupabaseAdmin()

  if (!supabase) {
    return {
      generatedAt: new Date().toISOString(),
      statuses: {},
    }
  }

  try {
    return {
      generatedAt: new Date().toISOString(),
      statuses: await fetchLatestStatusesFromProjection(supabase),
    }
  } catch (error) {
    if (!isMissingRelationError(error)) {
      throw error
    }

    return {
      generatedAt: new Date().toISOString(),
      statuses: await fetchLatestStatusesFromHistory(supabase),
    }
  }
}

export const getLatestStatusSnapshot = unstable_cache(
  loadLatestStatusSnapshot,
  ['status-snapshot'],
  {
    revalidate: STATUS_SNAPSHOT_CACHE_TTL_SECONDS,
    tags: [STATUS_SNAPSHOT_CACHE_TAG],
  }
)

export async function getLatestStatuses() {
  const snapshot = await getLatestStatusSnapshot()
  return snapshot.statuses
}

async function insertStatusRow(supabase, payload) {
  const primaryInsert = await supabase
    .from('restaurant_status')
    .insert([payload])
    .select()
    .single()

  if (!primaryInsert.error) {
    return primaryInsert.data
  }

  if (!isMissingRelationError(primaryInsert.error)) {
    throw primaryInsert.error
  }

  const fallbackInsert = await supabase
    .from('restaurant_status')
    .insert([
      {
        restaurant_name: payload.restaurant_name,
        lat: payload.lat,
        lng: payload.lng,
        status: payload.status,
        note: payload.note,
        confirmations: payload.confirmations,
      },
    ])
    .select()
    .single()

  if (fallbackInsert.error) {
    throw fallbackInsert.error
  }

  return fallbackInsert.data
}

async function upsertLatestStatusProjection(supabase, status) {
  const latestStatus = toLatestStatusRecord(status)

  if (!latestStatus?.restaurant_key) {
    return latestStatus
  }

  const { error } = await supabase.from(LATEST_STATUS_TABLE).upsert(
    {
      restaurant_key: latestStatus.restaurant_key,
      status_id: latestStatus.id,
      restaurant_name: latestStatus.restaurant_name,
      lat: latestStatus.lat,
      lng: latestStatus.lng,
      status: latestStatus.status,
      note: latestStatus.note,
      confirmations: latestStatus.confirmations,
      updated_at: latestStatus.updated_at,
      created_at: latestStatus.created_at,
    },
    { onConflict: 'restaurant_key' }
  )

  if (error && !isMissingRelationError(error)) {
    throw error
  }

  return latestStatus
}

export async function createStatus({
  restaurant_name,
  restaurant_key,
  lat,
  lng,
  status,
  note,
  authorIdentityHash = null,
}) {
  const supabase = requireSupabaseAdmin()

  const createdStatus = await insertStatusRow(supabase, {
    restaurant_name,
    restaurant_key,
    lat,
    lng,
    status,
    note,
    author_identity_hash: authorIdentityHash,
    confirmations: 1,
  })

  return upsertLatestStatusProjection(supabase, createdStatus)
}

export async function confirmStatus(statusId, viewerIdentityHash) {
  const supabase = requireSupabaseAdmin()

  const { data, error } = await supabase.rpc('add_restaurant_status_confirmation', {
    target_status_id: statusId,
    confirmer_identity_hash: viewerIdentityHash,
  })

  if (error) {
    const errorMessage = String(error.message || '')

    if (errorMessage.includes(SELF_CONFIRMATION_ERROR)) {
      throw new StatusSelfConfirmationError()
    }

    if (errorMessage.includes(ALREADY_CONFIRMED_ERROR)) {
      throw new StatusAlreadyConfirmedError()
    }

    throw error
  }

  const rpcStatus = normalizeStatusResult(data)
  const confirmedStatus = hasCompleteStatusPayload(rpcStatus)
    ? rpcStatus
    : await fetchStatusById(supabase, rpcStatus?.id || statusId)

  return upsertLatestStatusProjection(supabase, confirmedStatus)
}

export function deriveRestaurantKeyFromStatus(status) {
  return status?.restaurant_key || buildRestaurantKey(status || {})
}
