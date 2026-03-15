import { DEFAULT_DISTRICT_SLUG, normalizeDistrictSlug } from './districts.js'

export function getCatalogQueryKey(districtSlug = DEFAULT_DISTRICT_SLUG) {
  return ['catalog', normalizeDistrictSlug(districtSlug)]
}

export function getStatusSnapshotQueryKey(viewerScope = 'guest') {
  return ['status-snapshot', viewerScope]
}

export function getRestaurantCommentsQueryKey(
  restaurantKey,
  viewerScope = 'guest'
) {
  return ['restaurant-comments', restaurantKey, viewerScope]
}
