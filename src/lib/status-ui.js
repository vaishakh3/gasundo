import { getRestaurantKey } from './status-key.js'
import { formatTimeAgo, isTimestampStale } from './time-ago.js'

export const STATUS_META = {
  open: {
    label: 'Open',
    detailLabel: 'Open now',
    detailCopy: 'Full menu expected',
    badgeClass: 'border-emerald-400/25 bg-emerald-400/12 text-emerald-100',
    dotClass: 'bg-emerald-300 shadow-[0_0_18px_rgba(74,222,128,0.55)]',
    ringColor: '#34d399',
  },
  limited: {
    label: 'Limited',
    detailLabel: 'Limited menu',
    detailCopy: 'Some items may be unavailable',
    badgeClass: 'border-amber-300/25 bg-amber-300/12 text-amber-100',
    dotClass: 'bg-amber-200 shadow-[0_0_18px_rgba(251,191,36,0.5)]',
    ringColor: '#fbbf24',
  },
  closed: {
    label: 'Closed',
    detailLabel: 'Closed for gas shortage',
    detailCopy: 'Not serving right now',
    badgeClass: 'border-rose-300/25 bg-rose-300/12 text-rose-100',
    dotClass: 'bg-rose-200 shadow-[0_0_18px_rgba(251,113,133,0.45)]',
    ringColor: '#fb7185',
  },
  unknown: {
    label: 'Unknown',
    detailLabel: 'Needs a fresh update',
    detailCopy: 'No recent crowd report yet',
    badgeClass: 'border-slate-300/20 bg-slate-200/10 text-slate-100',
    dotClass: 'bg-slate-300 shadow-[0_0_14px_rgba(203,213,225,0.25)]',
    ringColor: '#94a3b8',
  },
}

export const STATUS_FILTERS = [
  { value: 'all', label: 'All places' },
  { value: 'open', label: 'Open' },
  { value: 'limited', label: 'Limited' },
  { value: 'closed', label: 'Closed' },
]

const STATUS_SORT_ORDER = {
  open: 0,
  limited: 1,
  unknown: 2,
  closed: 3,
}

export function getStatusMeta(status) {
  return STATUS_META[status] || STATUS_META.unknown
}

export function getRestaurantDisplayData(restaurant, statusMap, nowTimestamp) {
  const key = getRestaurantKey(restaurant)
  const statusData = statusMap[key] || null
  const status = statusData?.status || 'unknown'
  const updatedAt = statusData?.updated_at || null

  return {
    key,
    status,
    statusData,
    meta: getStatusMeta(status),
    freshnessText: updatedAt
      ? `Updated ${formatTimeAgo(updatedAt, nowTimestamp)}`
      : 'Needs an update',
    updatedAt,
    isStale: isTimestampStale(updatedAt, nowTimestamp),
    confirmations: statusData?.confirmations || 0,
    note: statusData?.note || '',
  }
}

export function getStatusSummary(restaurants, statusMap) {
  const summary = {
    open: 0,
    limited: 0,
    closed: 0,
    unknown: 0,
  }

  restaurants.forEach((restaurant) => {
    const { status } = getRestaurantDisplayData(restaurant, statusMap)
    summary[status] += 1
  })

  return summary
}

export function compareRestaurantRecords(a, b) {
  const statusDelta = STATUS_SORT_ORDER[a.status] - STATUS_SORT_ORDER[b.status]
  if (statusDelta !== 0) return statusDelta

  if (a.updatedAt && b.updatedAt) {
    const recencyDelta = new Date(b.updatedAt) - new Date(a.updatedAt)
    if (recencyDelta !== 0) return recencyDelta
  }

  if (a.updatedAt && !b.updatedAt) return -1
  if (!a.updatedAt && b.updatedAt) return 1

  return a.restaurant.name.localeCompare(b.restaurant.name)
}
