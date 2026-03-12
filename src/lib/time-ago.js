export function formatTimeAgo(dateString, nowTimestamp = Date.now()) {
  if (!dateString) return ''

  const now = new Date(nowTimestamp)
  const date = new Date(dateString)
  const seconds = Math.floor((now - date) / 1000)

  if (seconds < 60) return 'just now'

  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} min ago`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`

  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export function isTimestampStale(dateString, nowTimestamp = Date.now()) {
  if (!dateString) return false

  const now = new Date(nowTimestamp)
  const date = new Date(dateString)

  return (now - date) > 24 * 60 * 60 * 1000
}
