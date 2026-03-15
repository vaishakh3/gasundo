export const KERALA_BOUNDS = {
  minLat: 8.15,
  minLng: 74.85,
  maxLat: 12.85,
  maxLng: 77.45,
}

export const DEFAULT_DISTRICT_SLUG = 'ernakulam'

export const DISTRICT_OPTIONS = [
  {
    slug: 'alappuzha',
    name: 'Alappuzha',
    overpassName: 'Alappuzha',
    mapCenter: [9.4981, 76.3388],
    lookupBounds: { minLat: 9.05, minLng: 76.17, maxLat: 9.86, maxLng: 76.66 },
  },
  {
    slug: 'ernakulam',
    name: 'Ernakulam',
    overpassName: 'Ernakulam',
    mapCenter: [9.9312, 76.2673],
    lookupBounds: { minLat: 9.62, minLng: 76.08, maxLat: 10.3, maxLng: 76.82 },
  },
  {
    slug: 'idukki',
    name: 'Idukki',
    overpassName: 'Idukki',
    mapCenter: [9.848, 76.972],
    lookupBounds: { minLat: 9.25, minLng: 76.62, maxLat: 10.25, maxLng: 77.28 },
  },
  {
    slug: 'kannur',
    name: 'Kannur',
    overpassName: 'Kannur',
    mapCenter: [11.8745, 75.3704],
    lookupBounds: { minLat: 11.7, minLng: 75.15, maxLat: 12.32, maxLng: 75.92 },
  },
  {
    slug: 'kasaragod',
    name: 'Kasaragod',
    overpassName: 'Kasaragod',
    mapCenter: [12.4996, 74.9869],
    lookupBounds: { minLat: 12.16, minLng: 74.85, maxLat: 12.78, maxLng: 75.46 },
  },
  {
    slug: 'kollam',
    name: 'Kollam',
    overpassName: 'Kollam',
    mapCenter: [8.8932, 76.6141],
    lookupBounds: { minLat: 8.72, minLng: 76.4, maxLat: 9.3, maxLng: 77.02 },
  },
  {
    slug: 'kottayam',
    name: 'Kottayam',
    overpassName: 'Kottayam',
    mapCenter: [9.5916, 76.5222],
    lookupBounds: { minLat: 9.4, minLng: 76.33, maxLat: 10.0, maxLng: 76.85 },
  },
  {
    slug: 'kozhikode',
    name: 'Kozhikode',
    overpassName: 'Kozhikode',
    mapCenter: [11.2588, 75.7804],
    lookupBounds: { minLat: 11.05, minLng: 75.55, maxLat: 11.72, maxLng: 76.16 },
  },
  {
    slug: 'malappuram',
    name: 'Malappuram',
    overpassName: 'Malappuram',
    mapCenter: [11.051, 76.0711],
    lookupBounds: { minLat: 10.73, minLng: 75.83, maxLat: 11.33, maxLng: 76.53 },
  },
  {
    slug: 'palakkad',
    name: 'Palakkad',
    overpassName: 'Palakkad',
    mapCenter: [10.7867, 76.6548],
    lookupBounds: { minLat: 10.36, minLng: 76.05, maxLat: 11.15, maxLng: 76.93 },
  },
  {
    slug: 'pathanamthitta',
    name: 'Pathanamthitta',
    overpassName: 'Pathanamthitta',
    mapCenter: [9.2648, 76.787],
    lookupBounds: { minLat: 8.93, minLng: 76.55, maxLat: 9.62, maxLng: 77.24 },
  },
  {
    slug: 'thiruvananthapuram',
    name: 'Thiruvananthapuram',
    overpassName: 'Thiruvananthapuram',
    mapCenter: [8.5241, 76.9366],
    lookupBounds: { minLat: 8.15, minLng: 76.72, maxLat: 8.88, maxLng: 77.18 },
  },
  {
    slug: 'thrissur',
    name: 'Thrissur',
    overpassName: 'Thrissur',
    mapCenter: [10.5276, 76.2144],
    lookupBounds: { minLat: 10.2, minLng: 75.95, maxLat: 10.83, maxLng: 76.55 },
  },
  {
    slug: 'wayanad',
    name: 'Wayanad',
    overpassName: 'Wayanad',
    mapCenter: [11.6854, 76.132],
    lookupBounds: { minLat: 11.45, minLng: 75.75, maxLat: 12.1, maxLng: 76.48 },
  },
]

export const DISTRICT_BY_SLUG = Object.freeze(
  Object.fromEntries(DISTRICT_OPTIONS.map((district) => [district.slug, district]))
)

function toDistrictSlug(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function isWithinBounds(bounds, lat, lng) {
  return (
    lat >= bounds.minLat &&
    lat <= bounds.maxLat &&
    lng >= bounds.minLng &&
    lng <= bounds.maxLng
  )
}

function getDistanceScore(lat, lng, [centerLat, centerLng]) {
  return (lat - centerLat) ** 2 + (lng - centerLng) ** 2
}

export function parseDistrictSlug(value) {
  const slug = toDistrictSlug(value)
  return DISTRICT_BY_SLUG[slug] ? slug : null
}

export function normalizeDistrictSlug(value) {
  return parseDistrictSlug(value) || DEFAULT_DISTRICT_SLUG
}

export function getDistrictConfig(value) {
  return DISTRICT_BY_SLUG[normalizeDistrictSlug(value)]
}

export function isWithinKeralaBounds(lat, lng) {
  return isWithinBounds(KERALA_BOUNDS, lat, lng)
}

export function getDistrictByCoordinates(lat, lng) {
  if (!isWithinKeralaBounds(lat, lng)) {
    return null
  }

  const containingDistricts = DISTRICT_OPTIONS.filter((district) =>
    isWithinBounds(district.lookupBounds, lat, lng)
  )
  const candidates =
    containingDistricts.length > 0 ? containingDistricts : DISTRICT_OPTIONS

  return [...candidates].sort(
    (left, right) =>
      getDistanceScore(lat, lng, left.mapCenter) -
      getDistanceScore(lat, lng, right.mapCenter)
  )[0]
}
