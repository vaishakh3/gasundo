import 'server-only'

import { unstable_cache } from 'next/cache'
import bundledRestaurants from '../data/restaurants-kochi.json' with { type: 'json' }

import { DEFAULT_DISTRICT_SLUG, getDistrictConfig } from './districts.js'
import { buildRestaurantKey } from './status-key.js'

const DEFAULT_OVERPASS_URL = 'https://overpass-api.de/api/interpreter'
const RESTAURANTS_CACHE_TTL_SECONDS = 24 * 60 * 60
export const RESTAURANTS_CACHE_TAG = 'restaurant-catalog'
const DEFAULT_FETCH_TIMEOUT_MS = 8000
const FOOD_AMENITY_PATTERN =
  '^(restaurant|cafe|fast_food|food_court|bar|pub|ice_cream)$'

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

function escapeOverpassRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function buildDistrictOverpassQuery(district) {
  const districtNamePattern = `^${escapeOverpassRegex(
    district.overpassName
  )}( District| district)?$`

  return `
[out:json][timeout:25];
area["ISO3166-2"="IN-KL"]["boundary"="administrative"]->.kerala;
(
  relation(area.kerala)["boundary"="administrative"]["admin_level"~"5|6"]["name"~"${districtNamePattern}"];
  relation(area.kerala)["boundary"="administrative"]["admin_level"~"5|6"]["name:en"~"${districtNamePattern}"];
);
map_to_area->.searchArea;
(
  node["amenity"~"${FOOD_AMENITY_PATTERN}"](area.searchArea);
  way["amenity"~"${FOOD_AMENITY_PATTERN}"](area.searchArea);
  relation["amenity"~"${FOOD_AMENITY_PATTERN}"](area.searchArea);

  node["shop"="bakery"](area.searchArea);
  way["shop"="bakery"](area.searchArea);
  relation["shop"="bakery"](area.searchArea);

  node["amenity"="ice_cream"](area.searchArea);
  way["amenity"="ice_cream"](area.searchArea);
  relation["amenity"="ice_cream"](area.searchArea);
);
out center;
`
}

function normalizeRestaurantRecord(restaurant, district) {
  return {
    ...restaurant,
    district: district.name,
    district_slug: district.slug,
  }
}

async function fetchRestaurantsFromOverpass(district) {
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
    body: buildDistrictOverpassQuery(district),
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

      return normalizeRestaurantRecord(
        {
          id: `${element.type}:${element.id}`,
          restaurant_key: buildRestaurantKey({ name, lat, lng }),
          osm_type: element.type,
          osm_id: String(element.id),
          name,
          brand: tags.brand || null,
          address: buildRestaurantAddress(tags),
          lat,
          lng,
        },
        district
      )
    })
    .filter((restaurant) => restaurant.lat !== null && restaurant.lng !== null)
    .sort((left, right) => left.name.localeCompare(right.name))
}

async function loadRestaurantsCatalog(districtSlug = DEFAULT_DISTRICT_SLUG) {
  const district = getDistrictConfig(districtSlug)

  try {
    const liveRestaurants = await fetchRestaurantsFromOverpass(district)

    if (liveRestaurants.length > 0) {
      return liveRestaurants
    }

    console.warn(
      `Live restaurant catalog fetch returned no rows for ${district.name}.`
    )
  } catch (error) {
    console.error(
      `Failed to fetch the live restaurant catalog for ${district.name}:`,
      error
    )
  }

  if (district.slug === DEFAULT_DISTRICT_SLUG) {
    return bundledRestaurants.map((restaurant) =>
      normalizeRestaurantRecord(restaurant, district)
    )
  }

  throw new Error(`Could not load the ${district.name} restaurant catalog.`)
}

export const getRestaurants = unstable_cache(
  loadRestaurantsCatalog,
  ['restaurants'],
  {
    revalidate: RESTAURANTS_CACHE_TTL_SECONDS,
    tags: [RESTAURANTS_CACHE_TAG],
  }
)
