import 'server-only'

import { unstable_cache } from 'next/cache'
import bundledRestaurants from '../data/restaurants-kochi.json' with { type: 'json' }

import { KOCHI_BOUNDS, isWithinKochiBounds } from './constants.js'
import { buildRestaurantKey } from './status-key.js'

const DEFAULT_OVERPASS_URL = 'https://overpass-api.de/api/interpreter'
const RESTAURANTS_CACHE_TTL_SECONDS = 24 * 60 * 60
export const RESTAURANTS_CACHE_TAG = 'restaurant-catalog'
const DEFAULT_FETCH_TIMEOUT_MS = 8000
const FOOD_AMENITY_PATTERN =
  '^(restaurant|cafe|fast_food|food_court|bar|pub|ice_cream)$'

const KOCHI_QUERY = `
[out:json][timeout:25];
(
  node["amenity"~"${FOOD_AMENITY_PATTERN}"](${KOCHI_BOUNDS.minLat},${KOCHI_BOUNDS.minLng},${KOCHI_BOUNDS.maxLat},${KOCHI_BOUNDS.maxLng});
  way["amenity"~"${FOOD_AMENITY_PATTERN}"](${KOCHI_BOUNDS.minLat},${KOCHI_BOUNDS.minLng},${KOCHI_BOUNDS.maxLat},${KOCHI_BOUNDS.maxLng});
  relation["amenity"~"${FOOD_AMENITY_PATTERN}"](${KOCHI_BOUNDS.minLat},${KOCHI_BOUNDS.minLng},${KOCHI_BOUNDS.maxLat},${KOCHI_BOUNDS.maxLng});

  node["shop"="bakery"](${KOCHI_BOUNDS.minLat},${KOCHI_BOUNDS.minLng},${KOCHI_BOUNDS.maxLat},${KOCHI_BOUNDS.maxLng});
  way["shop"="bakery"](${KOCHI_BOUNDS.minLat},${KOCHI_BOUNDS.minLng},${KOCHI_BOUNDS.maxLat},${KOCHI_BOUNDS.maxLng});
  relation["shop"="bakery"](${KOCHI_BOUNDS.minLat},${KOCHI_BOUNDS.minLng},${KOCHI_BOUNDS.maxLat},${KOCHI_BOUNDS.maxLng});

  node["amenity"="ice_cream"](${KOCHI_BOUNDS.minLat},${KOCHI_BOUNDS.minLng},${KOCHI_BOUNDS.maxLat},${KOCHI_BOUNDS.maxLng});
  way["amenity"="ice_cream"](${KOCHI_BOUNDS.minLat},${KOCHI_BOUNDS.minLng},${KOCHI_BOUNDS.maxLat},${KOCHI_BOUNDS.maxLng});
  relation["amenity"="ice_cream"](${KOCHI_BOUNDS.minLat},${KOCHI_BOUNDS.minLng},${KOCHI_BOUNDS.maxLat},${KOCHI_BOUNDS.maxLng});
);
out center;
`

function parseCoordinate(value) {
  const numericValue = Number(value)
  return Number.isFinite(numericValue) ? numericValue : null
}

function normalizeAddressPart(value) {
  if (typeof value !== 'string') {
    return null
  }

  const normalizedValue = value.trim()
  return normalizedValue ? normalizedValue : null
}

function buildRestaurantAddress(tags) {
  if (!tags || typeof tags !== 'object') {
    return null
  }

  const streetLine = [tags['addr:housenumber'], tags['addr:street']]
    .map(normalizeAddressPart)
    .filter(Boolean)
    .join(' ')

  const locationFallbacks = [
    streetLine || null,
    normalizeAddressPart(tags['addr:place']),
    normalizeAddressPart(tags['addr:suburb']),
    normalizeAddressPart(tags['addr:city']),
    normalizeAddressPart(tags['addr:district']),
    normalizeAddressPart(tags['addr:housename']),
  ]

  return locationFallbacks.find(Boolean) || null
}

async function fetchRestaurantsFromOverpass() {
  const overpassUrl =
    process.env.RESTAURANT_CATALOG_OVERPASS_URL || DEFAULT_OVERPASS_URL
  const timeoutMs = Number(process.env.RESTAURANT_CATALOG_FETCH_TIMEOUT_MS)
  const effectiveTimeoutMs =
    Number.isFinite(timeoutMs) && timeoutMs > 0
      ? timeoutMs
      : DEFAULT_FETCH_TIMEOUT_MS

  const response = await fetch(overpassUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain;charset=UTF-8',
    },
    body: KOCHI_QUERY,
    cache: 'no-store',
    signal: AbortSignal.timeout(effectiveTimeoutMs),
  })

  if (!response.ok) {
    throw new Error(`Overpass API error: ${response.status}`)
  }

  const data = await response.json()
  const elements = Array.isArray(data?.elements) ? data.elements : []

  return elements
    .filter((element) => element?.tags?.name)
    .map((element) => {
      const lat = parseCoordinate(element.lat ?? element.center?.lat)
      const lng = parseCoordinate(element.lon ?? element.center?.lon)
      const tags = element.tags || {}
      const name = tags.name

      return {
        id: `${element.type}:${element.id}`,
        restaurant_key: buildRestaurantKey({ name, lat, lng }),
        osm_type: element.type,
        osm_id: String(element.id),
        name,
        brand: tags.brand || null,
        address: buildRestaurantAddress(tags),
        lat,
        lng,
      }
    })
    .filter(
      (restaurant) =>
        restaurant.lat !== null &&
        restaurant.lng !== null &&
        isWithinKochiBounds(restaurant.lat, restaurant.lng)
    )
    .sort((left, right) => left.name.localeCompare(right.name))
}

async function loadRestaurantsCatalog() {
  try {
    const liveRestaurants = await fetchRestaurantsFromOverpass()

    if (liveRestaurants.length > 0) {
      return liveRestaurants
    }

    console.warn(
      'Live restaurant catalog fetch returned no rows. Falling back to bundled snapshot.'
    )
  } catch (error) {
    console.error(
      'Failed to fetch the live restaurant catalog. Falling back to bundled snapshot:',
      error
    )
  }

  return bundledRestaurants
}

export const getRestaurants = unstable_cache(
  loadRestaurantsCatalog,
  ['restaurants'],
  {
    revalidate: RESTAURANTS_CACHE_TTL_SECONDS,
    tags: [RESTAURANTS_CACHE_TAG],
  }
)
