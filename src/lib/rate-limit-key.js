export function buildRateLimitKey(clientIp, userId) {
  return `${userId || 'anonymous'}:${clientIp || 'unknown'}`
}
