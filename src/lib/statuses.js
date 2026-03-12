import 'server-only'

import { unstable_cache } from 'next/cache'

import { buildRestaurantKey, getRestaurantKey } from './status-key.js'
import { isMissingRelationError } from './supabase-errors.js'
import { getSupabaseAdmin, requireSupabaseAdmin } from './supabase-admin.js'

const STATUS_SNAPSHOT_CACHE_TTL_SECONDS = 15
export const STATUS_SNAPSHOT_CACHE_TAG = 'status-snapshot'
const LATEST_STATUS_TABLE = 'restaurant_latest_status'

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

async function fetchLatestStatusSnapshot() {
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
  fetchLatestStatusSnapshot,
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
}) {
  const supabase = requireSupabaseAdmin()

  const createdStatus = await insertStatusRow(supabase, {
    restaurant_name,
    restaurant_key,
    lat,
    lng,
    status,
    note,
    confirmations: 1,
  })

  return upsertLatestStatusProjection(supabase, createdStatus)
}

async function confirmStatusFallback(supabase, statusId) {
  const current = await fetchStatusById(supabase, statusId)
  const nextCount = (current?.confirmations || 0) + 1

  const { data, error } = await supabase
    .from('restaurant_status')
    .update({ confirmations: nextCount })
    .eq('id', statusId)
    .select()
    .single()

  if (error) {
    throw error
  }

  return toLatestStatusRecord(data)
}

export async function confirmStatus(statusId) {
  const supabase = requireSupabaseAdmin()

  const { data, error } = await supabase.rpc('increment_confirmations', {
    status_id: statusId,
  })
  const rpcStatus = normalizeStatusResult(data)

  const confirmedStatus =
    error || !data
      ? await confirmStatusFallback(supabase, statusId)
      : hasCompleteStatusPayload(rpcStatus)
        ? rpcStatus
        : await fetchStatusById(supabase, rpcStatus?.id || statusId)

  return upsertLatestStatusProjection(supabase, confirmedStatus)
}

export function deriveRestaurantKeyFromStatus(status) {
  return status?.restaurant_key || buildRestaurantKey(status || {})
}
