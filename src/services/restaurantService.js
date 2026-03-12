const OVERPASS_URL = 'https://overpass-api.de/api/interpreter'

const CACHE_KEY = 'gasundo_restaurants_cache'
const CACHE_TTL_MS = 24 * 60 * 60 * 1000 // 24 hours

const KOCHI_QUERY = `
[out:json][timeout:25];
(
  node["amenity"~"restaurant|cafe|fast_food|food_court|bar|pub|ice_cream"](9.75,75.95,10.15,76.55);
  way["amenity"~"restaurant|cafe|fast_food|food_court|bar|pub|ice_cream"](9.75,75.95,10.15,76.55);
  relation["amenity"~"restaurant|cafe|fast_food|food_court|bar|pub|ice_cream"](9.75,75.95,10.15,76.55);

  node["shop"="bakery"](9.75,75.95,10.15,76.55);
  way["shop"="bakery"](9.75,75.95,10.15,76.55);
  relation["shop"="bakery"](9.75,75.95,10.15,76.55);

  node["amenity"="ice_cream"](9.75,75.95,10.15,76.55);
  way["amenity"="ice_cream"](9.75,75.95,10.15,76.55);
  relation["amenity"="ice_cream"](9.75,75.95,10.15,76.55);
);
out center;
`

export async function fetchRestaurants() {
  // 1. Check Cache
  const cachedStr = localStorage.getItem(CACHE_KEY)
  if (cachedStr) {
    try {
      const cached = JSON.parse(cachedStr)
      if (Date.now() - cached.timestamp < CACHE_TTL_MS) {
        console.log(`Loaded ${cached.data.length} restaurants from local cache`)
        return cached.data
      }
    } catch (e) {
      console.warn('Failed to parse cache, fetching fresh data', e)
    }
  }

  // 2. Fetch Fresh Data (Cache missing or stale)
  console.log('Fetching fresh restaurant data from Overpass API...')
  const response = await fetch(OVERPASS_URL, {
    method: 'POST',
    body: KOCHI_QUERY,
  })

  if (!response.ok) {
    throw new Error(`Overpass API error: ${response.status}`)
  }

  const data = await response.json()

  // 3. Parse Data (Handle nodes, ways, and relations)
  const parsedData = data.elements
    .filter((el) => el.tags && el.tags.name)
    .map((el) => {
      // Nodes use lat/lon directly; Ways/Relations use center.lat/center.lon
      const lat = el.lat || (el.center && el.center.lat)
      const lng = el.lon || (el.center && el.center.lon)

      return {
        id: el.id,
        name: el.tags.name,
        brand: el.tags.brand || null,
        lat: lat,
        lng: lng,
      }
    })
    .filter((el) => el.lat && el.lng) // Safety check to ensure we got valid coordinates

  // 4. Update Cache
  try {
    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({
        timestamp: Date.now(),
        data: parsedData,
      })
    )
  } catch (e) {
    console.warn('Failed to save to localStorage (maybe quota exceeded)', e)
  }

  console.log(`Successfully fetched and cached ${parsedData.length} locations`)
  return parsedData
}
