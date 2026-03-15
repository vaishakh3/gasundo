import 'server-only'

import { unstable_cache } from 'next/cache'
import bundledRestaurants from '../data/restaurants-kochi.json' with { type: 'json' }

import { KOCHI_BOUNDS, isWithinKochiBounds } from './constants.js'
import { getSupabaseAdmin } from './supabase-admin.js'
import { buildRestaurantKey } from './status-key.js'

const RESTAURANTS_CACHE_TTL_SECONDS = 24 * 60 * 60
export const RESTAURANTS_CACHE_TAG = 'restaurant-catalog'
const DEFAULT_FETCH_TIMEOUT_MS = 8000
const DB_SYNC_STALE_MS = 24 * 60 * 60 * 1000
const RESTAURANT_CATALOG_TABLE = 'restaurant_catalog'
const RESTAURANT_CATALOG_SYNC_TABLE = 'restaurant_catalog_sync'
const RESTAURANT_CATALOG_SYNC_ROW_ID = 'main'
const UPSERT_CHUNK_SIZE = 500
const GOOGLE_PLACES_SEARCH_NEARBY_URL =
  'https://places.googleapis.com/v1/places:searchNearby'
const GOOGLE_PLACES_FIELD_MASK = [
  'places.id',
  'places.displayName',
  'places.formattedAddress',
  'places.location',
  'places.primaryType',
  'places.types',
  'places.businessStatus',
].join(',')
const GOOGLE_PLACES_INCLUDED_TYPES = [
  'restaurant',
  'cafe',
  'bakery',
  'bar',
  'pub',
  'meal_takeaway',
  'meal_delivery',
  'fast_food_restaurant',
  'coffee_shop',
  'sandwich_shop',
  'pizza_restaurant',
  'ice_cream_shop',
  'food_court',
]
const GOOGLE_PLACES_ALLOWED_TYPES = new Set(GOOGLE_PLACES_INCLUDED_TYPES)
const KNOWN_BRANDS = [
  "McDonald's",
  'KFC',
  'Burger King',
  'Subway',
  "Domino's",
  'Pizza Hut',
  'Starbucks',
]
const GOOGLE_NEARBY_MAX_RESULT_COUNT = 20
const DEFAULT_GRID_MAX_DEPTH = 5
const DEFAULT_GRID_MIN_RADIUS_METERS = 220
const DEFAULT_GRID_INITIAL_RADIUS_METERS = 950

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

function getGooglePlacesApiKey() {
  return (
    process.env.GOOGLE_MAPS_API_KEY ||
    process.env.GOOGLE_PLACES_API_KEY ||
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
    null
  )
}

function inferBrand(name) {
  const normalizedName = String(name || '').trim().toLowerCase()
  return (
    KNOWN_BRANDS.find((brand) => normalizedName.includes(brand.toLowerCase())) ||
    null
  )
}

function isFoodPlace(place) {
  const types = Array.isArray(place?.types) ? place.types : []
  const primaryType = place?.primaryType || null

  if (primaryType && GOOGLE_PLACES_ALLOWED_TYPES.has(primaryType)) {
    return true
  }

  return types.some((type) => GOOGLE_PLACES_ALLOWED_TYPES.has(type))
}

async function searchGooglePlacesNearby({
  apiKey,
  timeoutMs,
  center,
  radiusMeters,
}) {
  const response = await fetch(GOOGLE_PLACES_SEARCH_NEARBY_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': GOOGLE_PLACES_FIELD_MASK,
    },
    body: JSON.stringify({
      includedTypes: GOOGLE_PLACES_INCLUDED_TYPES,
      excludedTypes: ['school', 'primary_school', 'secondary_school'],
      maxResultCount: GOOGLE_NEARBY_MAX_RESULT_COUNT,
      rankPreference: 'DISTANCE',
      locationRestriction: {
        circle: {
          center: {
            latitude: center.lat,
            longitude: center.lng,
          },
          radius: radiusMeters,
        },
      },
    }),
    cache: 'no-store',
    signal: AbortSignal.timeout(timeoutMs),
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(`Google Places API error: ${response.status} ${message}`)
  }

  return response.json()
}

function getBoundsCenter(bounds) {
  return {
    lat: (bounds.minLat + bounds.maxLat) / 2,
    lng: (bounds.minLng + bounds.maxLng) / 2,
  }
}

function getLongitudeDegreesForMeters(latitude, meters) {
  const latitudeRadians = (latitude * Math.PI) / 180
  const metersPerDegree = 111320 * Math.cos(latitudeRadians)

  if (!Number.isFinite(metersPerDegree) || metersPerDegree <= 0) {
    return 0
  }

  return meters / metersPerDegree
}

function getLatitudeDegreesForMeters(meters) {
  return meters / 110540
}

function splitBounds(bounds) {
  const midLat = (bounds.minLat + bounds.maxLat) / 2
  const midLng = (bounds.minLng + bounds.maxLng) / 2

  return [
    {
      minLat: bounds.minLat,
      maxLat: midLat,
      minLng: bounds.minLng,
      maxLng: midLng,
    },
    {
      minLat: bounds.minLat,
      maxLat: midLat,
      minLng: midLng,
      maxLng: bounds.maxLng,
    },
    {
      minLat: midLat,
      maxLat: bounds.maxLat,
      minLng: bounds.minLng,
      maxLng: midLng,
    },
    {
      minLat: midLat,
      maxLat: bounds.maxLat,
      minLng: midLng,
      maxLng: bounds.maxLng,
    },
  ]
}

function getSearchRadiusForBounds(bounds) {
  const center = getBoundsCenter(bounds)
  const latDistanceMeters = ((bounds.maxLat - bounds.minLat) * 110540) / 2
  const lngDistanceMeters =
    ((bounds.maxLng - bounds.minLng) * 111320 * Math.cos((center.lat * Math.PI) / 180)) /
    2
  const diagonalRadius = Math.sqrt(
    latDistanceMeters * latDistanceMeters + lngDistanceMeters * lngDistanceMeters
  )

  return Math.min(Math.max(diagonalRadius, 100), 50000)
}

async function crawlGooglePlacesCell({
  apiKey,
  timeoutMs,
  bounds,
  depth,
  maxDepth,
  minRadiusMeters,
  restaurantsByPlaceId,
}) {
  const center = getBoundsCenter(bounds)
  const radiusMeters = getSearchRadiusForBounds(bounds)
  const data = await searchGooglePlacesNearby({
    apiKey,
    timeoutMs,
    center,
    radiusMeters,
  })
  const places = Array.isArray(data?.places) ? data.places : []

  for (const place of places) {
    if (!isFoodPlace(place)) {
      continue
    }

    const restaurant = normalizeGooglePlace(place)

    if (!restaurant) {
      continue
    }

    restaurantsByPlaceId.set(restaurant.place_id, restaurant)
  }

  if (
    places.length < GOOGLE_NEARBY_MAX_RESULT_COUNT ||
    depth >= maxDepth ||
    radiusMeters <= minRadiusMeters
  ) {
    return
  }

  const childBounds = splitBounds(bounds)

  for (const nextBounds of childBounds) {
    await crawlGooglePlacesCell({
      apiKey,
      timeoutMs,
      bounds: nextBounds,
      depth: depth + 1,
      maxDepth,
      minRadiusMeters,
      restaurantsByPlaceId,
    })
  }
}

function normalizeGooglePlace(place) {
  const lat = parseCoordinate(place?.location?.latitude)
  const lng = parseCoordinate(place?.location?.longitude)
  const name = place?.displayName?.text || null

  if (!name || lat === null || lng === null || !isWithinKochiBounds(lat, lng)) {
    return null
  }

  return {
    id: `google:${place.id}`,
    place_id: place.id,
    restaurant_key: buildRestaurantKey({ name, lat, lng }),
    name,
    brand: inferBrand(name),
    address: normalizeAddressPart(place.formattedAddress),
    lat,
    lng,
    primary_type: place.primaryType || null,
    business_status: place.businessStatus || null,
    source: 'google-places',
  }
}

function mapCatalogRowToRestaurant(row) {
  return {
    id: `google:${row.place_id}`,
    place_id: row.place_id,
    restaurant_key: row.restaurant_key,
    name: row.name,
    brand: row.brand,
    address: row.address,
    lat: row.lat,
    lng: row.lng,
    primary_type: row.primary_type,
    business_status: row.business_status,
    source: row.source || 'google-places',
  }
}

async function readRestaurantsFromDb(supabase) {
  const { data, error } = await supabase
    .from(RESTAURANT_CATALOG_TABLE)
    .select(
      'place_id, restaurant_key, name, brand, address, lat, lng, primary_type, business_status, source'
    )
    .order('name', { ascending: true })

  if (error) {
    throw error
  }

  return Array.isArray(data) ? data.map(mapCatalogRowToRestaurant) : []
}

async function readExistingCatalogRowsByPlaceId(supabase) {
  const { data, error } = await supabase
    .from(RESTAURANT_CATALOG_TABLE)
    .select('place_id, restaurant_key, created_at, first_seen_at')

  if (error) {
    throw error
  }

  const rowsByPlaceId = new Map()

  for (const row of data || []) {
    rowsByPlaceId.set(row.place_id, row)
  }

  return rowsByPlaceId
}

async function readCatalogSyncState(supabase) {
  const { data, error } = await supabase
    .from(RESTAURANT_CATALOG_SYNC_TABLE)
    .select(
      'id, status, last_started_at, last_completed_at, last_successful_at, restaurant_count, last_error, updated_at'
    )
    .eq('id', RESTAURANT_CATALOG_SYNC_ROW_ID)
    .maybeSingle()

  if (error) {
    throw error
  }

  return data || null
}

async function writeCatalogSyncState(supabase, values) {
  const payload = {
    id: RESTAURANT_CATALOG_SYNC_ROW_ID,
    updated_at: new Date().toISOString(),
    ...values,
  }

  const { error } = await supabase
    .from(RESTAURANT_CATALOG_SYNC_TABLE)
    .upsert([payload], { onConflict: 'id' })

  if (error) {
    throw error
  }
}

function isCatalogSyncStale(syncState) {
  if (!syncState?.last_successful_at) {
    return true
  }

  const lastSuccessfulAt = new Date(syncState.last_successful_at).getTime()

  if (!Number.isFinite(lastSuccessfulAt)) {
    return true
  }

  return Date.now() - lastSuccessfulAt >= DB_SYNC_STALE_MS
}

function applyStableRestaurantKeys(restaurants, existingRowsByPlaceId) {
  return restaurants.map((restaurant) => {
    const existingRow = existingRowsByPlaceId.get(restaurant.place_id)

    if (!existingRow?.restaurant_key) {
      return restaurant
    }

    return {
      ...restaurant,
      restaurant_key: existingRow.restaurant_key,
    }
  })
}

function chunkArray(items, chunkSize) {
  const chunks = []

  for (let index = 0; index < items.length; index += chunkSize) {
    chunks.push(items.slice(index, index + chunkSize))
  }

  return chunks
}

async function upsertRestaurantsToDb(supabase, restaurants, existingRowsByPlaceId) {
  const nowIso = new Date().toISOString()
  const rows = restaurants.map((restaurant) => {
    const existingRow = existingRowsByPlaceId.get(restaurant.place_id)

    return {
      place_id: restaurant.place_id,
      restaurant_key: restaurant.restaurant_key,
      name: restaurant.name,
      brand: restaurant.brand,
      address: restaurant.address,
      lat: restaurant.lat,
      lng: restaurant.lng,
      primary_type: restaurant.primary_type,
      business_status: restaurant.business_status,
      source: restaurant.source || 'google-places',
      first_seen_at: existingRow?.first_seen_at || nowIso,
      last_seen_at: nowIso,
      created_at: existingRow?.created_at || nowIso,
      updated_at: nowIso,
    }
  })

  for (const chunk of chunkArray(rows, UPSERT_CHUNK_SIZE)) {
    const { error } = await supabase
      .from(RESTAURANT_CATALOG_TABLE)
      .upsert(chunk, { onConflict: 'place_id' })

    if (error) {
      throw error
    }
  }
}

async function syncRestaurantsToDb(supabase) {
  const syncStartedAt = new Date().toISOString()

  await writeCatalogSyncState(supabase, {
    status: 'syncing',
    last_started_at: syncStartedAt,
    last_error: null,
  })

  try {
    const existingRowsByPlaceId = await readExistingCatalogRowsByPlaceId(supabase)
    const liveRestaurants = applyStableRestaurantKeys(
      await fetchRestaurantsFromGooglePlaces(),
      existingRowsByPlaceId
    )

    if (liveRestaurants.length === 0) {
      throw new Error('Google Places sync returned no restaurants.')
    }

    await upsertRestaurantsToDb(supabase, liveRestaurants, existingRowsByPlaceId)

    const completedAt = new Date().toISOString()

    await writeCatalogSyncState(supabase, {
      status: 'idle',
      last_completed_at: completedAt,
      last_successful_at: completedAt,
      restaurant_count: liveRestaurants.length,
      last_error: null,
    })

    return liveRestaurants
  } catch (error) {
    await writeCatalogSyncState(supabase, {
      status: 'idle',
      last_completed_at: new Date().toISOString(),
      last_error: error instanceof Error ? error.message : String(error),
    })

    throw error
  }
}

async function fetchRestaurantsFromGooglePlaces() {
  const apiKey = getGooglePlacesApiKey()

  if (!apiKey) {
    throw new Error('Missing Google Places API key.')
  }

  const timeoutMs = Number(process.env.RESTAURANT_CATALOG_FETCH_TIMEOUT_MS)
  const effectiveTimeoutMs =
    Number.isFinite(timeoutMs) && timeoutMs > 0
      ? timeoutMs
      : DEFAULT_FETCH_TIMEOUT_MS
  const configuredMaxDepth = Number(process.env.RESTAURANT_CATALOG_GRID_MAX_DEPTH)
  const gridMaxDepth =
    Number.isFinite(configuredMaxDepth) && configuredMaxDepth > 0
      ? configuredMaxDepth
      : DEFAULT_GRID_MAX_DEPTH
  const configuredMinRadius = Number(
    process.env.RESTAURANT_CATALOG_GRID_MIN_RADIUS_METERS
  )
  const minRadiusMeters =
    Number.isFinite(configuredMinRadius) && configuredMinRadius > 0
      ? configuredMinRadius
      : DEFAULT_GRID_MIN_RADIUS_METERS

  const restaurantsByPlaceId = new Map()
  const initialCenter = getBoundsCenter(KOCHI_BOUNDS)
  const initialLatOffset = getLatitudeDegreesForMeters(
    DEFAULT_GRID_INITIAL_RADIUS_METERS
  )
  const initialLngOffset = getLongitudeDegreesForMeters(
    initialCenter.lat,
    DEFAULT_GRID_INITIAL_RADIUS_METERS
  )
  const initialBounds = {
    minLat: Math.max(KOCHI_BOUNDS.minLat, initialCenter.lat - initialLatOffset),
    maxLat: Math.min(KOCHI_BOUNDS.maxLat, initialCenter.lat + initialLatOffset),
    minLng: Math.max(KOCHI_BOUNDS.minLng, initialCenter.lng - initialLngOffset),
    maxLng: Math.min(KOCHI_BOUNDS.maxLng, initialCenter.lng + initialLngOffset),
  }

  const rootBoundsList = splitBounds(KOCHI_BOUNDS)

  for (const bounds of rootBoundsList) {
    await crawlGooglePlacesCell({
      apiKey,
      timeoutMs: effectiveTimeoutMs,
      bounds,
      depth: 1,
      maxDepth: gridMaxDepth,
      minRadiusMeters,
      restaurantsByPlaceId,
    })
  }

  await crawlGooglePlacesCell({
    apiKey,
    timeoutMs: effectiveTimeoutMs,
    bounds: initialBounds,
    depth: 1,
    maxDepth: Math.max(2, Math.min(gridMaxDepth, 3)),
    minRadiusMeters,
    restaurantsByPlaceId,
  })

  return Array.from(restaurantsByPlaceId.values()).sort((left, right) =>
    left.name.localeCompare(right.name)
  )
}

async function loadRestaurantsCatalog() {
  const supabase = getSupabaseAdmin()

  if (supabase) {
    try {
      const [dbRestaurants, syncState] = await Promise.all([
        readRestaurantsFromDb(supabase),
        readCatalogSyncState(supabase),
      ])

      if (dbRestaurants.length > 0 && !isCatalogSyncStale(syncState)) {
        return dbRestaurants
      }

      const syncedRestaurants = await syncRestaurantsToDb(supabase)

      if (syncedRestaurants.length > 0) {
        return syncedRestaurants
      }

      if (dbRestaurants.length > 0) {
        return dbRestaurants
      }
    } catch (error) {
      console.error(
        'Failed to load or sync the DB-backed restaurant catalog. Falling back to direct Google Places fetch:',
        error
      )
    }
  }

  try {
    const liveRestaurants = await fetchRestaurantsFromGooglePlaces()

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
