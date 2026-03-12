function normalizeRestaurantName(name) {
  const normalizedName = String(name || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return normalizedName || 'restaurant'
}

function normalizeCoordinate(value) {
  const numericValue = Number(value)

  if (!Number.isFinite(numericValue)) {
    return '0.00000'
  }

  return numericValue.toFixed(5)
}

export function buildRestaurantKey({ restaurant_name, name, lat, lng }) {
  return `${normalizeRestaurantName(name ?? restaurant_name)}::${normalizeCoordinate(lat)}::${normalizeCoordinate(lng)}`
}

export function getRestaurantKey(record) {
  if (record?.restaurant_key) {
    return record.restaurant_key
  }

  return buildRestaurantKey(record || {})
}

export function buildStatusKey(lat, lng, name = 'restaurant') {
  return buildRestaurantKey({ restaurant_name: name, lat, lng })
}
