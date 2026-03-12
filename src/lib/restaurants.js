import 'server-only'

import { unstable_cache } from 'next/cache'

import { KOCHI_BOUNDS, isWithinKochiBounds } from './constants.js'
import { buildRestaurantKey } from './status-key.js'

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter'
const RESTAURANTS_CACHE_TTL_SECONDS = 24 * 60 * 60
export const RESTAURANTS_CACHE_TAG = 'restaurant-catalog'

const KOCHI_QUERY = `
[out:json][timeout:25];
(
  node["amenity"~"restaurant|cafe|fast_food|food_court|bar|pub|ice_cream"](${KOCHI_BOUNDS.minLat},${KOCHI_BOUNDS.minLng},${KOCHI_BOUNDS.maxLat},${KOCHI_BOUNDS.maxLng});
  way["amenity"~"restaurant|cafe|fast_food|food_court|bar|pub|ice_cream"](${KOCHI_BOUNDS.minLat},${KOCHI_BOUNDS.minLng},${KOCHI_BOUNDS.maxLat},${KOCHI_BOUNDS.maxLng});
  relation["amenity"~"restaurant|cafe|fast_food|food_court|bar|pub|ice_cream"](${KOCHI_BOUNDS.minLat},${KOCHI_BOUNDS.minLng},${KOCHI_BOUNDS.maxLat},${KOCHI_BOUNDS.maxLng});

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

async function fetchRestaurantsFromOverpass() {
  const response = await fetch(OVERPASS_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain;charset=UTF-8',
    },
    body: KOCHI_QUERY,
    cache: 'no-store',
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
      const name = element.tags.name

      return {
        id: `${element.type}:${element.id}`,
        restaurant_key: buildRestaurantKey({ name, lat, lng }),
        osm_type: element.type,
        osm_id: String(element.id),
        name,
        brand: element.tags.brand || null,
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

export const getRestaurants = unstable_cache(
  fetchRestaurantsFromOverpass,
  ['restaurants'],
  {
    revalidate: RESTAURANTS_CACHE_TTL_SECONDS,
    tags: [RESTAURANTS_CACHE_TAG],
  }
)
