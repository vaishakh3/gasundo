export const CATALOG_QUERY_KEY = ['catalog']

export function getStatusSnapshotQueryKey(viewerScope = 'guest') {
  return ['status-snapshot', viewerScope]
}

export function getRestaurantCommentsQueryKey(
  restaurantKey,
  viewerScope = 'guest'
) {
  return ['restaurant-comments', restaurantKey, viewerScope]
}
